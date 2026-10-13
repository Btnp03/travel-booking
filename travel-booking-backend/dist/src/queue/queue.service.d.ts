import { Queue } from 'bullmq';
export declare class QueueService {
    private bookingQueue;
    constructor(bookingQueue: Queue);
    addExpireBookingJob(bookingId: string, expireAt: Date): Promise<void>;
}
