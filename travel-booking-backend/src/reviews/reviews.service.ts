import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  private readonly reviewWindowMs = 48 * 60 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  async createForBooking(userId: string, bookingId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('This is not your booking');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be reviewed');
    }

    if (booking.review) {
      throw new ConflictException('This booking has already been reviewed');
    }

    this.validateReviewWindow(booking.checkOut);

    return this.prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        bookingId: booking.id,
        userId: booking.userId,
        roomId: booking.roomId,
      },
    });
  }

  findByRoom(roomId: string) {
    return this.prisma.review.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  private validateReviewWindow(checkOut: Date) {
    const now = new Date();
    const reviewEndsAt = new Date(checkOut.getTime() + this.reviewWindowMs);

    if (now < checkOut) {
      throw new BadRequestException('You can review after check-out');
    }

    if (now > reviewEndsAt) {
      throw new BadRequestException('Review period has expired');
    }
  }
}
