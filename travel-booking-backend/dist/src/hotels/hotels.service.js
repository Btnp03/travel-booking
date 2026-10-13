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
exports.HotelsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const review_summary_1 = require("./review-summary");
let HotelsService = class HotelsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
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
            include: review_summary_1.hotelReviewInclude,
        });
        return (0, review_summary_1.withHotelReviewSummary)(hotel);
    }
    async findAll() {
        const hotels = await this.prisma.hotel.findMany({
            include: review_summary_1.hotelReviewInclude,
        });
        return hotels.map(review_summary_1.withHotelReviewSummary);
    }
    async findOne(id) {
        const hotel = await this.prisma.hotel.findUnique({
            where: { id },
            include: review_summary_1.hotelReviewInclude,
        });
        return hotel ? (0, review_summary_1.withHotelReviewSummary)(hotel) : null;
    }
    delete(id) {
        return this.prisma.hotel.delete({
            where: { id },
        });
    }
};
exports.HotelsService = HotelsService;
exports.HotelsService = HotelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HotelsService);
//# sourceMappingURL=hotels.service.js.map