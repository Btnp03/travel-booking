import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
    createForBooking(req: any, bookingId: string, dto: CreateReviewDto): Promise<{
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
}
