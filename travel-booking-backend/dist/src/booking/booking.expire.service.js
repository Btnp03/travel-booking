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
exports.BookingExpireService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingExpireService = class BookingExpireService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async expireBookings() {
        const now = new Date();
        const expiredBookings = await this.prisma.booking.findMany({
            where: {
                status: client_1.BookingStatus.PENDING,
                expiresAt: { lt: now },
            },
        });
        if (expiredBookings.length === 0)
            return;
        console.log(`Expiring ${expiredBookings.length} bookings...`);
        for (const booking of expiredBookings) {
            await this.prisma.$transaction(async (tx) => {
                const dates = this.getDatesBetween(booking.checkIn, booking.checkOut);
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
                await tx.booking.update({
                    where: { id: booking.id },
                    data: { status: client_1.BookingStatus.EXPIRED },
                });
            });
        }
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
};
exports.BookingExpireService = BookingExpireService;
__decorate([
    (0, schedule_1.Cron)('* * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingExpireService.prototype, "expireBookings", null);
exports.BookingExpireService = BookingExpireService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingExpireService);
//# sourceMappingURL=booking.expire.service.js.map