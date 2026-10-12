import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import {
  hotelReviewInclude,
  withHotelReviewSummary,
} from './review-summary';

@Injectable()
export class HotelsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHotelDto) {
    const { keyPoints, ...hotelData } = dto;

    const hotel = await this.prisma.hotel.create({
      data: {
        ...hotelData,
        keyPoints: keyPoints?.length
          ? {
              create: keyPoints.map((point, index) => ({
                label: point.label,
                detail: point.detail,
                category: point.category,
                icon: point.icon,
                sortOrder: point.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: hotelReviewInclude,
    });

    return withHotelReviewSummary(hotel);
  }

  async findAll() {
    const hotels = await this.prisma.hotel.findMany({
      include: hotelReviewInclude,
    });

    return hotels.map(withHotelReviewSummary);
  }

  async findOne(id: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: hotelReviewInclude,
    });

    return hotel ? withHotelReviewSummary(hotel) : null;
  }

  delete(id: string) {
    return this.prisma.hotel.delete({
      where: { id },
    });
  }
}
