import { Test, TestingModule } from '@nestjs/testing';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';

describe('HotelsController', () => {
  let controller: HotelsController;
  const hotelsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [
        {
          provide: HotelsService,
          useValue: hotelsService,
        },
      ],
    }).compile();

    controller = module.get<HotelsController>(HotelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should pass multiple images to hotels service on create', () => {
    const dto = {
      name: 'Seaside Resort',
      description: 'Beachfront stay',
      location: 'Pattaya',
      images: ['https://img.example.com/1.jpg', 'https://img.example.com/2.jpg'],
    };

    controller.create(dto);

    expect(hotelsService.create).toHaveBeenCalledWith(dto);
  });
});
