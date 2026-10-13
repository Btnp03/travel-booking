import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingExpireService {
  constructor(private prisma: PrismaService) {}

  @Cron('* * * * *')
  async expireBookings() {
    const now = new Date();

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        expiresAt: { lt: now },
      },
    });

    if (expiredBookings.length === 0) return;

    console.log(`Expiring ${expiredBookings.length} bookings...`);

    for (const booking of expiredBookings) {
      await this.prisma.$transaction(async (tx) => {
        const dates = this.getDatesBetween(booking.checkIn, booking.checkOut);

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

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.EXPIRED },
        });
      });
    }
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
}
