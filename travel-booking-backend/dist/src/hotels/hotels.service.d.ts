import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
export declare class HotelsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateHotelDto): Promise<{
        keyPoints: {
            id: string;
            createdAt: Date;
            label: string;
            detail: string;
            category: string | null;
            icon: string | null;
            sortOrder: number;
            hotelId: string;
        }[];
        rooms: ({
            reviews: {
                rating: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            price: number;
            capacity: number;
            quantity: number;
            hotelId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        description: string;
        location: string;
        images: string[];
    } & {
        reviewScore: number | null;
        reviewCount: number;
    }>;
    findAll(): Promise<({
        keyPoints: {
            id: string;
            createdAt: Date;
            label: string;
            detail: string;
            category: string | null;
            icon: string | null;
            sortOrder: number;
            hotelId: string;
        }[];
        rooms: ({
            reviews: {
                rating: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            price: number;
            capacity: number;
            quantity: number;
            hotelId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        description: string;
        location: string;
        images: string[];
    } & {
        reviewScore: number | null;
        reviewCount: number;
    })[]>;
    findOne(id: string): Promise<({
        keyPoints: {
            id: string;
            createdAt: Date;
            label: string;
            detail: string;
            category: string | null;
            icon: string | null;
            sortOrder: number;
            hotelId: string;
        }[];
        rooms: ({
            reviews: {
                rating: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            price: number;
            capacity: number;
            quantity: number;
            hotelId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        description: string;
        location: string;
        images: string[];
    } & {
        reviewScore: number | null;
        reviewCount: number;
    }) | null>;
    delete(id: string): import("@prisma/client").Prisma.Prisma__HotelClient<{
        id: string;
        createdAt: Date;
        name: string;
        description: string;
        location: string;
        images: string[];
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
