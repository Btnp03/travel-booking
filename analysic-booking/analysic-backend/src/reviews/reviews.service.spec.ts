import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  const prismaService = {
    booking: {
      findUnique: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new ReviewsService(prismaService as unknown as PrismaService);
    jest.useFakeTimers().setSystemTime(new Date('2026-06-02T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create review for owned confirmed booking within 48 hours after checkout', async () => {
    const booking = {
      id: 'booking-id',
      userId: 'user-id',
      roomId: 'room-id',
      status: BookingStatus.CONFIRMED,
      checkOut: new Date('2026-06-01T00:00:00.000Z'),
      review: null,
    };
    const dto = { rating: 10, comment: 'Great stay' };
    prismaService.booking.findUnique.mockResolvedValue(booking);
    prismaService.review.create.mockResolvedValue({ id: 'review-id', ...dto });

    await expect(service.createForBooking('user-id', 'booking-id', dto)).resolves.toEqual({
      id: 'review-id',
      ...dto,
    });

    expect(prismaService.review.create).toHaveBeenCalledWith({
      data: {
        rating: 10,
        comment: 'Great stay',
        bookingId: 'booking-id',
        userId: 'user-id',
        roomId: 'room-id',
      },
    });
  });

  it('should reject review from another user', async () => {
    prismaService.booking.findUnique.mockResolvedValue({
      userId: 'owner-id',
    });

    await expect(
      service.createForBooking('other-id', 'booking-id', { rating: 8 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject duplicate review', async () => {
    prismaService.booking.findUnique.mockResolvedValue({
      userId: 'user-id',
      status: BookingStatus.CONFIRMED,
      review: { id: 'review-id' },
    });

    await expect(
      service.createForBooking('user-id', 'booking-id', { rating: 8 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should reject review after 48 hours from checkout', async () => {
    prismaService.booking.findUnique.mockResolvedValue({
      userId: 'user-id',
      status: BookingStatus.CONFIRMED,
      checkOut: new Date('2026-05-30T23:59:59.000Z'),
      review: null,
    });

    await expect(
      service.createForBooking('user-id', 'booking-id', { rating: 8 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
