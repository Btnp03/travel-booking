import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

describe('RoomsController', () => {
  let controller: RoomsController;
  const roomsService = {
    create: jest.fn(),
    findByHotel: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [{ provide: RoomsService, useValue: roomsService }],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should pass create dto to rooms service', () => {
    const dto = {
      name: 'Deluxe',
      price: 1200,
      capacity: 2,
      quantity: 5,
      hotelId: '0f8fad5b-d9cb-469f-a165-70867728950e',
    };

    controller.create(dto);

    expect(roomsService.create).toHaveBeenCalledWith(dto);
  });
});
