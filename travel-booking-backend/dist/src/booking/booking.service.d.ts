import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RedisLockService } from '../redis/redis-lock.service';
import { QueueService } from '../queue/queue.service';
export declare class BookingService {
    private prisma;
    private redis;
    private lockService;
    private queueService;
    constructor(prisma: PrismaService, redis: RedisService, lockService: RedisLockService, queueService: QueueService);
    createBooking(userId: string, roomId: string, checkIn: Date, checkOut: Date, guests: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        roomId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
        total: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        expiresAt: Date | null;
    }>;
    payBooking(userId: string, bookingId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        roomId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
        total: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        expiresAt: Date | null;
    }>;
    cancelBooking(userId: string, bookingId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        roomId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
        total: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        expiresAt: Date | null;
    }>;
    getMyBookings(userId: string): Promise<({
        room: {
            hotel: {
                id: string;
                createdAt: Date;
                name: string;
                description: string;
                location: string;
                images: string[];
            };
        } & {
            id: string;
            createdAt: Date;
            name: string;
            price: number;
            capacity: number;
            quantity: number;
            hotelId: string;
        };
        review: {
            id: string;
            createdAt: Date;
            userId: string;
            rating: number;
            comment: string | null;
            bookingId: string;
            roomId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        roomId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
        total: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        expiresAt: Date | null;
    })[]>;
    getBookingById(userId: string, bookingId: string): Promise<{
        room: {
            hotel: {
                id: string;
                createdAt: Date;
                name: string;
                description: string;
                location: string;
                images: string[];
            };
        } & {
            id: string;
            createdAt: Date;
            name: string;
            price: number;
            capacity: number;
            quantity: number;
            hotelId: string;
        };
        review: {
            id: string;
            createdAt: Date;
            userId: string;
            rating: number;
            comment: string | null;
            bookingId: string;
            roomId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        roomId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
        total: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        expiresAt: Date | null;
    }>;
    private getDatesBetween;
    private startOfDay;
    private toDateKey;
    private getOwnedBooking;
    private canCancel;
    private clearSearchCache;
}
