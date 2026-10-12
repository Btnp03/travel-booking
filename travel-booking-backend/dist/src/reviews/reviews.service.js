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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    reviewWindowMs = 48 * 60 * 60 * 1000;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createForBooking(userId, bookingId, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { review: true },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.userId !== userId) {
            throw new common_1.ForbiddenException('This is not your booking');
        }
        if (booking.status !== client_1.BookingStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Only confirmed bookings can be reviewed');
        }
        if (booking.review) {
            throw new common_1.ConflictException('This booking has already been reviewed');
        }
        this.validateReviewWindow(booking.checkOut);
        return this.prisma.review.create({
            data: {
                rating: dto.rating,
                comment: dto.comment,
                bookingId: booking.id,
                userId: booking.userId,
                roomId: booking.roomId,
            },
        });
    }
    findByRoom(roomId) {
        return this.prisma.review.findMany({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
    }
    validateReviewWindow(checkOut) {
        const now = new Date();
        const reviewEndsAt = new Date(checkOut.getTime() + this.reviewWindowMs);
        if (now < checkOut) {
            throw new common_1.BadRequestException('You can review after check-out');
        }
        if (now > reviewEndsAt) {
            throw new common_1.BadRequestException('Review period has expired');
        }
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map