import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BookingController } from '../src/booking/booking.controller';
import { BookingService } from '../src/booking/booking.service';
import { JwtAuthGuard } from '../src/auth/jwt.guard';
import { PrismaService } from '../src/prisma/prisma.service';

class TestJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { userId: 'user-1' };
    return true;
  }
}

class AnotherUserGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { userId: 'another-user' };
    return true;
  }
}

describe('BookingController (e2e)', () => {
  let app: INestApplication;

  const createPrismaMock = () => {
    const bookings: any[] = [];
    const inventoryRows = [
      {
        id: 'inv-1',
        roomId: 'room-1',
        date: new Date('2026-05-20T08:00:00.000Z'),
        available: 2,
      },
      {
        id: 'inv-2',
        roomId: 'room-1',
        date: new Date('2026-05-21T08:00:00.000Z'),
        available: 2,
      },
      {
        id: 'inv-3',
        roomId: 'room-1',
        date: new Date('2026-05-22T08:00:00.000Z'),
        available: 2,
      },
    ];
    const room = {
      id: 'room-1',
      price: 1200,
      capacity: 2,
      hotel: { id: 'hotel-1', name: 'Test Hotel' },
    };

    const makeTx = () => ({
      room: {
        findUnique: jest.fn().mockImplementation(async ({ where }) => {
          return where.id === room.id ? room : null;
        }),
      },
      roomInventory: {
        findMany: jest.fn().mockImplementation(async ({ where }) => {
          return inventoryRows.filter(
            (row) =>
              row.roomId === where.roomId &&
              row.date >= where.date.gte &&
              row.date < where.date.lt,
          );
        }),
        updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
          let count = 0;
          for (const row of inventoryRows) {
            const roomMatch = !where.roomId || row.roomId === where.roomId;
            const idMatch = !where.id || row.id === where.id;
            const gteMatch = !where.date?.gte || row.date >= where.date.gte;
            const ltMatch = !where.date?.lt || row.date < where.date.lt;
            const availableMatch =
              !where.available?.gt || row.available > where.available.gt;

            if (roomMatch && idMatch && gteMatch && ltMatch && availableMatch) {
              if (data.available?.decrement) {
                row.available -= data.available.decrement;
              }
              if (data.available?.increment) {
                row.available += data.available.increment;
              }
              count += 1;
            }
          }
          return { count };
        }),
      },
      booking: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const booking = {
            id: `booking-${bookings.length + 1}`,
            createdAt: new Date(),
            ...data,
          };
          bookings.push(booking);
          return booking;
        }),
        findUnique: jest.fn().mockImplementation(async ({ where }) => {
          return bookings.find((booking) => booking.id === where.id) ?? null;
        }),
        update: jest.fn().mockImplementation(async ({ where, data }) => {
          const booking = bookings.find((row) => row.id === where.id);
          if (!booking) {
            throw new Error('Booking not found');
          }
          Object.assign(booking, data);
          return booking;
        }),
        findMany: jest.fn().mockImplementation(async ({ where }) => {
          return bookings.filter((booking) => booking.userId === where.userId);
        }),
      },
    });

    return {
      state: { bookings, inventoryRows },
      service: {
        booking: {
          findMany: jest.fn(),
          findUnique: jest.fn().mockImplementation(async ({ where, include }) => {
            const booking = bookings.find((row) => row.id === where.id) ?? null;
            if (!booking) return null;
            if (include?.room) {
              return { ...booking, room };
            }
            return booking;
          }),
        },
        $transaction: jest.fn(async (callback) => callback(makeTx())),
      },
    };
  };

  afterEach(async () => {
    jest.useRealTimers();
    if (app) {
      await app.close();
    }
  });

  it('should complete the create -> pay flow', async () => {
    const prismaMock = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prismaMock.service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const createRes = await request(app.getHttpServer())
      .post('/booking')
      .send({
        roomId: 'room-1',
        checkIn: '2026-05-20',
        checkOut: '2026-05-22',
        guests: 2,
      })
      .expect(201);

    expect(createRes.body.status).toBe('PENDING');

    const payRes = await request(app.getHttpServer())
      .post(`/booking/${createRes.body.id}/pay`)
      .expect(201);

    expect(payRes.body.status).toBe('CONFIRMED');
    expect(prismaMock.state.inventoryRows[0].available).toBe(1);
    expect(prismaMock.state.inventoryRows[1].available).toBe(1);
  });

  it('should complete the create -> cancel flow', async () => {
    const prismaMock = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prismaMock.service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const createRes = await request(app.getHttpServer())
      .post('/booking')
      .send({
        roomId: 'room-1',
        checkIn: '2026-05-20',
        checkOut: '2026-05-22',
        guests: 2,
      })
      .expect(201);

    expect(prismaMock.state.inventoryRows[0].available).toBe(1);
    expect(prismaMock.state.inventoryRows[1].available).toBe(1);

    const cancelRes = await request(app.getHttpServer())
      .post(`/booking/${createRes.body.id}/cancel`)
      .expect(201);

    expect(cancelRes.body.status).toBe('CANCELLED');
    expect(prismaMock.state.inventoryRows[0].available).toBe(2);
    expect(prismaMock.state.inventoryRows[1].available).toBe(2);
  });

  it('should get booking detail by id (owner)', async () => {
    const prismaMock = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prismaMock.service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // create booking ก่อน
    const createRes = await request(app.getHttpServer())
      .post('/booking')
      .send({
        roomId: 'room-1',
        checkIn: '2026-05-20',
        checkOut: '2026-05-22',
        guests: 2,
      })
      .expect(201);

    const bookingId = createRes.body.id;

    // เรียกดู booking detail
    const res = await request(app.getHttpServer())
      .get(`/booking/${bookingId}`)
      .expect(200);

    expect(res.body.id).toBe(bookingId);
    expect(res.body.roomId).toBe('room-1');
    expect(res.body.userId).toBe('user-1');
  });

  it('should NOT allow paying an expired booking', async () => {
    const prismaMock = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prismaMock.service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const createRes = await request(app.getHttpServer())
      .post('/booking')
      .send({
        roomId: 'room-1',
        checkIn: '2026-05-20',
        checkOut: '2026-05-22',
        guests: 2,
      })
      .expect(201);

    const booking = prismaMock.state.bookings.find(
      (row) => row.id === createRes.body.id,
    );
    booking.status = 'EXPIRED';
    booking.expiresAt = new Date(Date.now() - 60_000);

    const payRes = await request(app.getHttpServer())
      .post(`/booking/${createRes.body.id}/pay`)
      .expect(409);

    expect(payRes.body.message).toContain('cannot be paid');
  });

  it('should NOT allow cancelling a CONFIRMED booking', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-19T12:00:00.000Z'));

    const prismaMock = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prismaMock.service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const createRes = await request(app.getHttpServer())
      .post('/booking')
      .send({
        roomId: 'room-1',
        checkIn: '2026-05-20',
        checkOut: '2026-05-22',
        guests: 2,
      })
      .expect(201);

    expect(prismaMock.state.inventoryRows[0].available).toBe(1);
    expect(prismaMock.state.inventoryRows[1].available).toBe(1);

    await request(app.getHttpServer())
      .post(`/booking/${createRes.body.id}/pay`)
      .expect(201);

    const cancelRes = await request(app.getHttpServer())
      .post(`/booking/${createRes.body.id}/cancel`)
      .expect(400);

    expect(cancelRes.body.message).toContain('Cannot cancel within 24 hours');

    const booking = prismaMock.state.bookings.find(
      (row) => row.id === createRes.body.id,
    );
    expect(booking.status).toBe('CONFIRMED');
    expect(prismaMock.state.inventoryRows[0].available).toBe(1);
    expect(prismaMock.state.inventoryRows[1].available).toBe(1);
  });

  it('should return 403 when user does not own booking', async () => {
    const prismaMock = createPrismaMock();
    const ownerModuleRef = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prismaMock.service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtGuard())
      .compile();

    app = ownerModuleRef.createNestApplication();
    await app.init();

    const createRes = await request(app.getHttpServer())
      .post('/booking')
      .send({
        roomId: 'room-1',
        checkIn: '2026-05-20',
        checkOut: '2026-05-22',
        guests: 2,
      })
      .expect(201);

    await app.close();

    const anotherUserModuleRef = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prismaMock.service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new AnotherUserGuard())
      .compile();

    app = anotherUserModuleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get(`/booking/${createRes.body.id}`)
      .expect(403);
  });

  it('should fail when inventory is not enough', async () => {
    const prismaMock = createPrismaMock();
    prismaMock.state.inventoryRows[0].available = 0;
    prismaMock.service.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        room: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'room-1',
            price: 1200,
            capacity: 2,
            hotel: { id: 'hotel-1', name: 'Test Hotel' },
          }),
        },
        roomInventory: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'inv-1',
              roomId: 'room-1',
              date: new Date('2026-05-20T08:00:00.000Z'),
              available: 0,
            },
            {
              id: 'inv-2',
              roomId: 'room-1',
              date: new Date('2026-05-21T08:00:00.000Z'),
              available: 2,
            },
          ]),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        booking: {
          create: jest.fn(),
        },
      }),
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: prismaMock.service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestJwtGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/booking')
      .send({
        roomId: 'room-1',
        checkIn: '2026-05-20',
        checkOut: '2026-05-22',
        guests: 2,
      })
      .expect(409);

    expect(res.body.message).toContain('Room not available');
  });
});
