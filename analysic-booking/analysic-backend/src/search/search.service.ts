import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { RedisService } from '../redis/redis.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import {
  hotelReviewInclude,
  withHotelReviewSummary,
} from '../hotels/review-summary';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private redis: RedisService,
  ) {}

  async search(dto: SearchHotelsDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    const guests = dto.guests;
    const normalizedCheckIn = this.startOfDay(checkIn);
    const normalizedCheckOut = this.startOfDay(checkOut);
    const stayStyle = dto.stayStyle?.trim();
    const cacheKey = `search:${dto.location}:${dto.checkIn}:${dto.checkOut}:${dto.guests}:${stayStyle ?? 'any'}`;

    const cached = await this.redis.getCache(cacheKey);
    if (cached) {
      console.log('[Redis] Search cache hit');
      return cached;
    }

    const hotels = await this.prisma.hotel.findMany({
      where: {
        location: {
          contains: dto.location,
          mode: 'insensitive',
        },
        ...(stayStyle
          ? {
              keyPoints: {
                some: {
                  OR: [
                    {
                      label: {
                        contains: stayStyle,
                        mode: 'insensitive',
                      },
                    },
                    {
                      detail: {
                        contains: stayStyle,
                        mode: 'insensitive',
                      },
                    },
                    {
                      category: {
                        contains: stayStyle,
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            }
          : {}),
      },
      include: hotelReviewInclude,
    });

    const dates: Date[] = [];
    let current = new Date(normalizedCheckIn);

    while (current < normalizedCheckOut) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const availableHotels: typeof hotels = [];

    for (const hotel of hotels) {
      let hotelAvailable = false;

      for (const room of hotel.rooms) {
        if (room.capacity < guests) continue;

        const inventory = await this.prisma.roomInventory.findMany({
          where: {
            roomId: room.id,
            date: {
              gte: normalizedCheckIn,
              lt: normalizedCheckOut,
            },
            available: { gt: 0 },
          },
        });

        const inventoryDates = new Set(
          inventory.map((day) => this.toDateKey(day.date)),
        );

        if (inventoryDates.size === dates.length) {
          hotelAvailable = true;
          break;
        }
      }

      if (hotelAvailable) {
        availableHotels.push(hotel);
      }
    }

    const hotelsWithReviewSummaries = availableHotels.map(withHotelReviewSummary);

    await this.redis.setCache(cacheKey, hotelsWithReviewSummaries, 300);
    console.log('[Redis] Search cached');
    return hotelsWithReviewSummaries;
  }

  private startOfDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
