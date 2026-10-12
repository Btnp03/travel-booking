import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { RedisService } from '../redis/redis.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: {
            hotel: {
              findMany: jest.fn(),
            },
            roomInventory: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: InventoryService,
          useValue: {
            generateInventory: jest.fn(),
            checkAvailability: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getCache: jest.fn(),
            setCache: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
