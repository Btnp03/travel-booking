import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsService {
    private prisma;
    private readonly reviewWindowMs;
    constructor(prisma: PrismaService);
    createForBooking(userId: string, bookingId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        rating: number;
        comment: string | null;
        bookingId: string;
        roomId: string;
    }>;
    findByRoom(roomId: string): import("@prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        rating: number;
        comment: string | null;
        bookingId: string;
        roomId: string;
    })[]>;
    private validateReviewWindow;
}
