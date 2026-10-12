import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingController {
    private bookingService;
    constructor(bookingService: BookingService);
    pay(id: string, req: any): Promise<{
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
    create(req: any, dto: CreateBookingDto): Promise<{
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
    cancel(id: string, req: any): Promise<{
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
    getMyBookings(req: any): Promise<({
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
    getBooking(req: any, id: string): Promise<{
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
}
