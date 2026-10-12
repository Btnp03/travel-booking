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
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const redis_lock_service_1 = require("../redis/redis-lock.service");
const queue_service_1 = require("../queue/queue.service");
let BookingService = class BookingService {
    prisma;
    redis;
    lockService;
    queueService;
    constructor(prisma, redis, lockService, queueService) {
        this.prisma = prisma;
        this.redis = redis;
        this.lockService = lockService;
        this.queueService = queueService;
    }
    async createBooking(userId, roomId, checkIn, checkOut, guests) {
        if (!userId || !roomId) {
            throw new common_1.BadRequestException('userId and roomId are required');
        }
        if (Number.isNaN(checkIn.getTime()) ||
            Number.isNaN(checkOut.getTime()) ||
            checkIn >= checkOut) {
            throw new common_1.BadRequestException('Invalid check-in/check-out dates');
        }
        if (!Number.isInteger(guests) || guests <= 0) {
            throw new common_1.BadRequestException('Guests must be a positive integer');
        }
        const normalizedCheckIn = this.startOfDay(checkIn);
        const normalizedCheckOut = this.startOfDay(checkOut);
        const nights = this.getDatesBetween(normalizedCheckIn, normalizedCheckOut);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const lockKey = `booking:${roomId}:${normalizedCheckIn.toISOString()}:${normalizedCheckOut.toISOString()}`;
        const booking = await this.lockService.withLock(lockKey, 10000, async () => {
            return this.prisma.$transaction(async (tx) => {
                const room = await tx.room.findUnique({
                    where: { id: roomId },
                });
                if (!room)
                    throw new common_1.NotFoundException('Room not found');
                if (room.capacity < guests)
                    throw new common_1.BadRequestException('Guests exceed room capacity');
                const overlappingBooking = await tx.booking.findFirst({
                    where: {
                        userId,
                        status: { in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED] },
                        checkIn: { lt: normalizedCheckOut },
                        checkOut: { gt: normalizedCheckIn },
                    },
                });
                if (overlappingBooking)
                    throw new common_1.ConflictException('You already have a booking during the selected dates');
                const inventory = await tx.roomInventory.findMany({
                    where: {
                        roomId,
                        date: { gte: normalizedCheckIn, lt: normalizedCheckOut },
                    },
                    orderBy: { date: 'asc' },
                });
                const inventoryDates = new Set(inventory.map((d) => this.toDateKey(d.date)));
                if (inventoryDates.size !== nights.length)
                    throw new common_1.ConflictException('Room not available');
                for (const day of inventory) {
                    const updated = await tx.roomInventory.updateMany({
                        where: { id: day.id, available: { gt: 0 } },
                        data: { available: { decrement: 1 } },
                    });
                    if (updated.count !== 1)
                        throw new common_1.ConflictException('Room not available');
                }
                return tx.booking.create({
                    data: {
                        userId,
                        roomId,
                        checkIn: normalizedCheckIn,
                        checkOut: normalizedCheckOut,
                        guests,
                        total: room.price * nights.length,
                        status: client_1.BookingStatus.PENDING,
                        expiresAt,
                    },
                });
            });
        });
        await this.queueService.addExpireBookingJob(booking.id, expiresAt);
        await this.clearSearchCache();
        return booking;
    }
    async payBooking(userId, bookingId) {
        const lockKey = `pay:${bookingId}`;
        return this.lockService.withLock(lockKey, 5000, async () => {
            return this.prisma.$transaction(async (tx) => {
                const booking = await this.getOwnedBooking(tx, bookingId, userId);
                if (booking.status !== client_1.BookingStatus.PENDING)
                    throw new common_1.ConflictException('Booking cannot be paid');
                if (booking.expiresAt < new Date())
                    throw new common_1.BadRequestException('Booking has expired');
                const updatedBooking = await tx.booking.update({
                    where: { id: bookingId },
                    data: { status: client_1.BookingStatus.CONFIRMED },
                });
                await this.clearSearchCache();
                return updatedBooking;
            });
        });
    }
    async cancelBooking(userId, bookingId) {
        const lockKey = `cancel:${bookingId}`;
        return this.lockService.withLock(lockKey, 10000, async () => {
            return this.prisma.$transaction(async (tx) => {
                const booking = await this.getOwnedBooking(tx, bookingId, userId);
                if (booking.status === client_1.BookingStatus.CANCELLED) {
                    throw new common_1.ConflictException('Booking already cancelled');
                }
                if (booking.status !== client_1.BookingStatus.PENDING &&
                    booking.status !== client_1.BookingStatus.CONFIRMED) {
                    throw new common_1.BadRequestException('Booking cannot be cancelled');
                }
                const dates = this.getDatesBetween(booking.checkIn, booking.checkOut);
                if (!this.canCancel(booking.checkIn)) {
                    throw new common_1.BadRequestException('Cannot cancel within 24 hours of check-in');
                }
                for (const date of dates) {
                    const dayStart = this.startOfDay(date);
                    const nextDay = new Date(dayStart);
                    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
                    await tx.roomInventory.updateMany({
                        where: {
                            roomId: booking.roomId,
                            date: {
                                gte: dayStart,
                                lt: nextDay,
                            },
                        },
                        data: {
                            available: { increment: 1 },
                        },
                    });
                }
                const cancelledBooking = await tx.booking.update({
                    where: { id: bookingId },
                    data: { status: client_1.BookingStatus.CANCELLED },
                });
                await this.clearSearchCache();
                return cancelledBooking;
            });
        });
    }
    async getMyBookings(userId) {
        return this.prisma.booking.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                review: true,
                room: {
                    include: {
                        hotel: true,
                    },
                },
            },
        });
    }
    async getBookingById(userId, bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                review: true,
                room: {
                    include: {
                        hotel: true,
                    },
                },
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.userId !== userId) {
            throw new common_1.ForbiddenException('This is not your booking');
        }
        return booking;
    }
    getDatesBetween(checkIn, checkOut) {
        const dates = [];
        const current = new Date(checkIn);
        while (current < checkOut) {
            dates.push(new Date(current));
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return dates;
    }
    startOfDay(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    toDateKey(date) {
        return date.toISOString().slice(0, 10);
    }
    async getOwnedBooking(tx, bookingId, userId) {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.userId !== userId) {
            throw new common_1.ForbiddenException('This is not your booking');
        }
        return booking;
    }
    canCancel(checkIn) {
        const now = new Date();
        const diffMs = checkIn.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours >= 24;
    }
    async clearSearchCache() {
        await this.redis.deleteByPrefix('search:');
        console.log('[Redis] Search cache cleared');
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        redis_lock_service_1.RedisLockService,
        queue_service_1.QueueService])
], BookingService);
//# sourceMappingURL=booking.service.js.map