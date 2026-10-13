import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

describe('BookingController', () => {
  let controller: BookingController;
  let bookingService: {
    createBooking: jest.Mock;
    cancelBooking: jest.Mock;
    payBooking: jest.Mock;
    getMyBookings: jest.Mock;
    getBookingById: jest.Mock;
  };

  beforeEach(async () => {
    bookingService = {
      createBooking: jest.fn(),
      cancelBooking: jest.fn(),
      payBooking: jest.fn(),
      getMyBookings: jest.fn(),
      getBookingById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: bookingService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should pass booking payload to service', async () => {
    const req = { user: { userId: 'user-1' } };
    const body = {
      roomId: 'room-1',
      checkIn: '2026-05-10',
      checkOut: '2026-05-12',
      guests: 2,
    };

    await controller.create(req, body);

    expect(bookingService.createBooking).toHaveBeenCalledWith(
      'user-1',
      'room-1',
      new Date('2026-05-10'),
      new Date('2026-05-12'),
      2,
    );
  });

  it('should pass booking id and user id to pay service', () => {
    const req = { user: { userId: 'user-1' } };

    controller.pay('booking-1', req);

    expect(bookingService.payBooking).toHaveBeenCalledWith(
      'user-1',
      'booking-1',
    );
  });

  it('should pass booking id and user id to cancel service', () => {
    const req = { user: { userId: 'user-1' } };

    controller.cancel('booking-1', req);

    expect(bookingService.cancelBooking).toHaveBeenCalledWith(
      'user-1',
      'booking-1',
    );
  });

  it('should request current user bookings', () => {
    const req = { user: { userId: 'user-1' } };

    controller.getMyBookings(req);

    expect(bookingService.getMyBookings).toHaveBeenCalledWith('user-1');
  });
});
