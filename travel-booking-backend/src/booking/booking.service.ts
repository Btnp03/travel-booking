import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RedisLockService } from '../redis/redis-lock.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private lockService: RedisLockService,
    private queueService: QueueService,
  ) {}

  async createBooking(
    userId: string,
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    guests: number,
  ) {
    if (!userId || !roomId) {
      throw new BadRequestException('userId and roomId are required');
    }

    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime()) ||
      checkIn >= checkOut
    ) {
      throw new BadRequestException('Invalid check-in/check-out dates');
    }

    if (!Number.isInteger(guests) || guests <= 0) {
      throw new BadRequestException('Guests must be a positive integer');
    }

    const normalizedCheckIn = this.startOfDay(checkIn);
    const normalizedCheckOut = this.startOfDay(checkOut);
    const nights = this.getDatesBetween(normalizedCheckIn, normalizedCheckOut);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const lockKey = `booking:${roomId}:${normalizedCheckIn.toISOString()}:${normalizedCheckOut.toISOString()}`;

    const booking = await this.lockService.withLock(lockKey, 10000, async () => {
  return this.prisma.$transaction(async (tx) => {

    const room = await tx.room.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.capacity < guests)
      throw new BadRequestException('Guests exceed room capacity');

    const overlappingBooking = await tx.booking.findFirst({
      where: {
        userId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkIn: { lt: normalizedCheckOut },
        checkOut: { gt: normalizedCheckIn },
      },
    });

    if (overlappingBooking)
      throw new ConflictException('You already have a booking during the selected dates');

    const inventory = await tx.roomInventory.findMany({
      where: {
        roomId,
        date: { gte: normalizedCheckIn, lt: normalizedCheckOut },
      },
      orderBy: { date: 'asc' },
    });

    const inventoryDates = new Set(
      inventory.map((d) => this.toDateKey(d.date)),
    );

    if (inventoryDates.size !== nights.length)
      throw new ConflictException('Room not available');

    for (const day of inventory) {
      const updated = await tx.roomInventory.updateMany({
        where: { id: day.id, available: { gt: 0 } },
        data: { available: { decrement: 1 } },
      });

      if (updated.count !== 1)
        throw new ConflictException('Room not available');
    }

    return tx.booking.create({
      data: {
        userId,
        roomId,
        checkIn: normalizedCheckIn,
        checkOut: normalizedCheckOut,
        guests,
        total: room.price * nights.length,
        status: BookingStatus.PENDING,
        expiresAt,
      },
    });

  });
});
    await this.queueService.addExpireBookingJob(
      booking.id,
      expiresAt,
    );

    await this.clearSearchCache();
    return booking;
  }

  async payBooking(userId: string, bookingId: string) {
  const lockKey = `pay:${bookingId}`;

  return this.lockService.withLock(lockKey, 5000, async () => {
    return this.prisma.$transaction(async (tx) => {
      const booking = await this.getOwnedBooking(tx, bookingId, userId);

      if (booking.status !== BookingStatus.PENDING)
        throw new ConflictException('Booking cannot be paid');

      if (booking.expiresAt < new Date())
        throw new BadRequestException('Booking has expired');

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      await this.clearSearchCache();
      return updatedBooking;
    });
  });
}

  async cancelBooking(userId: string, bookingId: string) {
  const lockKey = `cancel:${bookingId}`;

  return this.lockService.withLock(lockKey, 10000, async () => {
    return this.prisma.$transaction(async (tx) => {
      const booking = await this.getOwnedBooking(tx, bookingId, userId);

      if (booking.status === BookingStatus.CANCELLED) {
        throw new ConflictException('Booking already cancelled');
      }

      if (
        booking.status !== BookingStatus.PENDING &&
        booking.status !== BookingStatus.CONFIRMED
      ) {
        throw new BadRequestException('Booking cannot be cancelled');
      }

      const dates = this.getDatesBetween(booking.checkIn, booking.checkOut);

      if (!this.canCancel(booking.checkIn)) {
        throw new BadRequestException(
          'Cannot cancel within 24 hours of check-in',
        );
      }

      for (const date of dates) {
        const dayStart = this.startOfDay(date);
        const nextDay = new Date(dayStart);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        await tx.roomInventory.updateMany({
          where: {
            roomId: booking.roomId,
            date: {
              gte: dayStart,
              lt: nextDay,
            },
          },
          data: {
            available: { increment: 1 },
          },
        });
      }

      const cancelledBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      await this.clearSearchCache();
      return cancelledBooking;
    });
  });
}

  async getMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        review: true,
        room: {
          include: {
            hotel: true,
          },
        },
      },
    });
  }

  async getBookingById(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        review: true,
        room: {
          include: {
            hotel: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('This is not your booking');
    }

    return booking;
  }

  private getDatesBetween(checkIn: Date, checkOut: Date) {
    const dates: Date[] = [];
    const current = new Date(checkIn);

    while (current < checkOut) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
  }

  private startOfDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private async getOwnedBooking(tx: any, bookingId: string, userId: string) {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('This is not your booking');
    }

    return booking;
  }

  private canCancel(checkIn: Date) {
    const now = new Date();
    const diffMs = checkIn.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours >= 24;
  }

  private async clearSearchCache() {
    await this.redis.deleteByPrefix('search:');
    console.log('[Redis] Search cache cleared');
  }
}
