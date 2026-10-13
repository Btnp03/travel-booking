import { Test, TestingModule } from '@nestjs/testing';
import { HotelsService } from './hotels.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HotelsService', () => {
  let service: HotelsService;
  const prismaService = {
    hotel: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<HotelsService>(HotelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should store multiple images when creating a hotel', () => {
    const dto = {
      name: 'Seaside Resort',
      description: 'Beachfront stay',
      location: 'Pattaya',
      images: ['https://img.example.com/1.jpg', 'https://img.example.com/2.jpg'],
    };
    prismaService.hotel.create.mockResolvedValue({
      ...dto,
      rooms: [],
    });

    void service.create(dto);

    expect(prismaService.hotel.create).toHaveBeenCalledWith({
      data: {
        ...dto,
        keyPoints: undefined,
      },
      include: {
        keyPoints: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        rooms: {
          include: {
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
    });
  });
});
