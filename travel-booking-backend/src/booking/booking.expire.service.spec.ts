import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus } from '@prisma/client';
import { BookingExpireService } from './booking.expire.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BookingExpireService', () => {
  let service: BookingExpireService;
  let prisma: {
    booking: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (callback) =>
        callback({
          roomInventory: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          booking: {
            update: jest.fn().mockResolvedValue({
              id: 'booking-1',
              status: BookingStatus.EXPIRED,
            }),
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingExpireService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<BookingExpireService>(BookingExpireService);
  });

  it('should do nothing when there are no expired bookings', async () => {
    await service.expireBookings();

    expect(prisma.booking.findMany).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should restore inventory and expire stale pending bookings', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const bookingUpdate = jest
      .fn()
      .mockResolvedValue({ id: 'booking-1', status: BookingStatus.EXPIRED });

    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
        roomId: 'room-1',
        checkIn: new Date('2026-08-01T00:00:00.000Z'),
        checkOut: new Date('2026-08-03T00:00:00.000Z'),
        status: BookingStatus.PENDING,
        expiresAt: new Date('2026-05-14T00:00:00.000Z'),
      },
    ]);

    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        roomInventory: {
          updateMany,
        },
        booking: {
          update: bookingUpdate,
        },
      }),
    );

    await service.expireBookings();

    expect(updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        roomId: 'room-1',
        date: {
          gte: new Date('2026-08-01T00:00:00.000Z'),
          lt: new Date('2026-08-02T00:00:00.000Z'),
        },
      },
      data: {
        available: { increment: 1 },
      },
    });
    expect(updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        roomId: 'room-1',
        date: {
          gte: new Date('2026-08-02T00:00:00.000Z'),
          lt: new Date('2026-08-03T00:00:00.000Z'),
        },
      },
      data: {
        available: { increment: 1 },
      },
    });
    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { status: BookingStatus.EXPIRED },
    });
  });
});
