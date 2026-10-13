import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RedisLockService } from '../redis/redis-lock.service';
import { QueueService } from '../queue/queue.service';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: {
    $transaction: jest.Mock;
    booking: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let redis: {
    deleteByPrefix: jest.Mock;
  };
  let lockService: {
    withLock: jest.Mock;
  };
  let queueService: {
    addExpireBookingJob: jest.Mock;
  };

  beforeEach(async () => {
    redis = {
      deleteByPrefix: jest.fn().mockResolvedValue(undefined),
    };
    lockService = {
      withLock: jest.fn(async (_key, _ttl, callback) => callback()),
    };
    queueService = {
      addExpireBookingJob: jest.fn().mockResolvedValue(undefined),
    };

    prisma = {
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (callback) =>
        callback({
          room: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'room-1',
              price: 1200,
              capacity: 2,
            }),
          },
          roomInventory: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'inv-1',
                available: 2,
                date: new Date('2026-05-10T08:14:42.257Z'),
              },
              {
                id: 'inv-2',
                available: 2,
                date: new Date('2026-05-11T08:14:42.257Z'),
              },
            ]),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          booking: {
            create: jest.fn().mockImplementation(({ data }) =>
              Promise.resolve({ id: 'booking-1', ...data }),
            ),
            findFirst: jest.fn().mockResolvedValue(null),
            findUnique: jest.fn(),
            update: jest.fn().mockResolvedValue({
              id: 'booking-2',
              status: BookingStatus.CANCELLED,
            }),
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: RedisService,
          useValue: redis,
        },
        {
          provide: RedisLockService,
          useValue: lockService,
        },
        {
          provide: QueueService,
          useValue: queueService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a booking with calculated total', async () => {
    const booking = await service.createBooking(
      'user-1',
      'room-1',
      new Date('2026-05-10'),
      new Date('2026-05-12'),
      2,
    );

    expect(booking).toMatchObject({
      id: 'booking-1',
      userId: 'user-1',
      roomId: 'room-1',
      guests: 2,
      total: 2400,
      status: BookingStatus.PENDING,
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should reject booking when guests exceed room capacity', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        room: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'room-1',
            price: 1200,
            capacity: 1,
          }),
        },
      }),
    );

    await expect(
      service.createBooking(
        'user-1',
        'room-1',
        new Date('2026-05-10'),
        new Date('2026-05-12'),
        2,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject booking when inventory does not cover all nights', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        room: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'room-1',
            price: 1200,
            capacity: 2,
          }),
        },
        roomInventory: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'inv-1',
              available: 2,
              date: new Date('2026-05-10T08:14:42.257Z'),
            },
          ]),
        },
        booking: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      }),
    );

    await expect(
      service.createBooking(
        'user-1',
        'room-1',
        new Date('2026-05-10'),
        new Date('2026-05-12'),
        2,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should reject booking when the user already has an overlapping booking', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        room: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'room-1',
            price: 1200,
            capacity: 2,
          }),
        },
        booking: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'booking-overlap',
            userId: 'user-1',
            status: BookingStatus.CONFIRMED,
          }),
        },
      }),
    );

    await expect(
      service.createBooking(
        'user-1',
        'room-1',
        new Date('2026-05-10'),
        new Date('2026-05-12'),
        2,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should reject payment when booking is not pending', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-1',
            userId: 'user-1',
            status: BookingStatus.CONFIRMED,
          }),
        },
      }),
    );

    await expect(service.payBooking('user-1', 'booking-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('should reject payment when booking has already expired by time', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-1',
            userId: 'user-1',
            status: BookingStatus.PENDING,
            expiresAt: new Date(Date.now() - 60_000),
          }),
        },
      }),
    );

    await expect(service.payBooking('user-1', 'booking-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should pay a pending booking owned by the user', async () => {
    const bookingUpdate = jest
      .fn()
      .mockResolvedValue({ id: 'booking-1', status: BookingStatus.CONFIRMED });

    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-1',
            userId: 'user-1',
            status: BookingStatus.PENDING,
          }),
          update: bookingUpdate,
        },
      }),
    );

    const result = await service.payBooking('user-1', 'booking-1');

    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { status: BookingStatus.CONFIRMED },
    });
    expect(result).toEqual({
      id: 'booking-1',
      status: BookingStatus.CONFIRMED,
    });
  });

  it('should reject pay/cancel when the booking belongs to another user', async () => {
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-1',
            userId: 'another-user',
            status: BookingStatus.PENDING,
          }),
        },
      }),
    );

    await expect(service.payBooking('user-1', 'booking-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.cancelBooking('user-1', 'booking-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should restore inventory when a pending booking is cancelled', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const bookingUpdate = jest
      .fn()
      .mockResolvedValue({ id: 'booking-2', status: BookingStatus.CANCELLED });

    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        roomInventory: {
          updateMany,
        },
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-2',
            userId: 'user-1',
            roomId: 'room-1',
            checkIn: new Date('2026-07-17T00:00:00.000Z'),
            checkOut: new Date('2026-07-19T00:00:00.000Z'),
            status: BookingStatus.PENDING,
          }),
          update: bookingUpdate,
        },
      }),
    );

    const result = await service.cancelBooking('user-1', 'booking-2');

    expect(updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        roomId: 'room-1',
        date: {
          gte: new Date('2026-07-17T00:00:00.000Z'),
          lt: new Date('2026-07-18T00:00:00.000Z'),
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
          gte: new Date('2026-07-18T00:00:00.000Z'),
          lt: new Date('2026-07-19T00:00:00.000Z'),
        },
      },
      data: {
        available: { increment: 1 },
      },
    });
    expect(result).toEqual({
      id: 'booking-2',
      status: BookingStatus.CANCELLED,
    });
  });

  it('should allow cancelling a confirmed booking', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const bookingUpdate = jest
      .fn()
      .mockResolvedValue({ id: 'booking-3', status: BookingStatus.CANCELLED });

    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        roomInventory: {
          updateMany,
        },
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-3',
            userId: 'user-1',
            roomId: 'room-1',
            checkIn: new Date(Date.now() + 48 * 60 * 60 * 1000),
            checkOut: new Date(Date.now() + 72 * 60 * 60 * 1000),
            status: BookingStatus.CONFIRMED,
          }),
          update: bookingUpdate,
        },
      }),
    );

    const result = await service.cancelBooking('user-1', 'booking-3');

    expect(updateMany).toHaveBeenCalled();
    expect(result).toEqual({
      id: 'booking-3',
      status: BookingStatus.CANCELLED,
    });
  });

  it('should reject cancel when booking is already cancelled', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-2',
            userId: 'user-1',
            roomId: 'room-1',
            checkIn: new Date('2026-07-17T00:00:00.000Z'),
            checkOut: new Date('2026-07-19T00:00:00.000Z'),
            status: BookingStatus.CANCELLED,
          }),
        },
      }),
    );

    await expect(
      service.cancelBooking('user-1', 'booking-2'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should reject cancel when booking is expired', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'booking-4',
            userId: 'user-1',
            roomId: 'room-1',
            checkIn: new Date('2026-07-17T00:00:00.000Z'),
            checkOut: new Date('2026-07-19T00:00:00.000Z'),
            status: BookingStatus.EXPIRED,
          }),
        },
      }),
    );

    await expect(
      service.cancelBooking('user-1', 'booking-4'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return the current user bookings', async () => {
    const rows = [{ id: 'booking-1' }];
    prisma.booking.findMany.mockResolvedValue(rows);

    const result = await service.getMyBookings('user-1');

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
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
    expect(result).toBe(rows);
  });

  it('should reject booking detail lookup when booking does not exist', async () => {
    prisma.booking.findUnique.mockResolvedValue(null);

    await expect(
      service.getBookingById('user-1', 'booking-404'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should return booking detail when it belongs to the current user', async () => {
    const booking = {
      id: 'booking-1',
      userId: 'user-1',
      room: {
        hotel: {
          id: 'hotel-1',
        },
      },
    };
    prisma.booking.findUnique.mockResolvedValue(booking);

    const result = await service.getBookingById('user-1', 'booking-1');

    expect(prisma.booking.findUnique).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      include: {
        review: true,
        room: {
          include: {
            hotel: true,
          },
        },
      },
    });
    expect(result).toBe(booking);
  });
});
