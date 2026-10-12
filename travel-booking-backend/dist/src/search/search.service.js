"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const redis_service_1 = require("../redis/redis.service");
const review_summary_1 = require("../hotels/review-summary");
let SearchService = class SearchService {
    prisma;
    inventoryService;
    redis;
    constructor(prisma, inventoryService, redis) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
        this.redis = redis;
    }
    async search(dto) {
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
            include: review_summary_1.hotelReviewInclude,
        });
        const dates = [];
        let current = new Date(normalizedCheckIn);
        while (current < normalizedCheckOut) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        const availableHotels = [];
        for (const hotel of hotels) {
            let hotelAvailable = false;
            for (const room of hotel.rooms) {
                if (room.capacity < guests)
                    continue;
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
                const inventoryDates = new Set(inventory.map((day) => this.toDateKey(day.date)));
                if (inventoryDates.size === dates.length) {
                    hotelAvailable = true;
                    break;
                }
            }
            if (hotelAvailable) {
                availableHotels.push(hotel);
            }
        }
        const hotelsWithReviewSummaries = availableHotels.map(review_summary_1.withHotelReviewSummary);
        await this.redis.setCache(cacheKey, hotelsWithReviewSummaries, 300);
        console.log('[Redis] Search cached');
        return hotelsWithReviewSummaries;
    }
    startOfDay(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    toDateKey(date) {
        return date.toISOString().slice(0, 10);
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService,
        redis_service_1.RedisService])
], SearchService);
//# sourceMappingURL=search.service.js.map