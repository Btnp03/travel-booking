import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

describe('RoomsService', () => {
  let service: RoomsService;
  const prismaService = {
    room: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  const inventoryService = {
    generateInventory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: InventoryService, useValue: inventoryService },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create room and generate inventory', async () => {
    const dto = {
      name: 'Deluxe',
      price: 1200,
      capacity: 2,
      quantity: 5,
      hotelId: '0f8fad5b-d9cb-469f-a165-70867728950e',
    };
    const room = { id: 'room-id', ...dto };
    prismaService.room.create.mockResolvedValue(room);
    inventoryService.generateInventory.mockResolvedValue({ count: 365 });

    await expect(service.create(dto)).resolves.toEqual(room);

    expect(prismaService.room.create).toHaveBeenCalledWith({ data: dto });
    expect(inventoryService.generateInventory).toHaveBeenCalledWith('room-id', 5);
  });
});
