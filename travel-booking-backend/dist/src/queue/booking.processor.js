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
exports.BookingProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let BookingProcessor = class BookingProcessor extends bullmq_1.WorkerHost {
    prisma;
    redis;
    constructor(prisma, redis) {
        super();
        this.prisma = prisma;
        this.redis = redis;
    }
    async process(job) {
        if (job.name === 'expire-booking') {
            const { bookingId } = job.data;
            console.log('⏰ Processing expire booking:', bookingId);
            const booking = await this.prisma.booking.findUnique({
                where: { id: bookingId },
            });
            if (!booking || booking.status !== 'PENDING') {
                console.log('✅ Booking already paid/cancelled');
                return;
            }
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: { status: 'CANCELLED' },
            });
            console.log('❌ Booking expired & cancelled:', bookingId);
            await this.redis.clearByPrefix('search:');
        }
    }
};
exports.BookingProcessor = BookingProcessor;
exports.BookingProcessor = BookingProcessor = __decorate([
    (0, bullmq_1.Processor)('booking'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], BookingProcessor);
//# sourceMappingURL=booking.processor.js.map