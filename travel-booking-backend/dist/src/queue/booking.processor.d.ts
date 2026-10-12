import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class BookingProcessor extends WorkerHost {
    private prisma;
    private redis;
    constructor(prisma: PrismaService, redis: RedisService);
    process(job: Job<any>): Promise<void>;
}
