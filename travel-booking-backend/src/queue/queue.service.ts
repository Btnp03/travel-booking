import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('booking') private bookingQueue: Queue,
  ) {}

  async addExpireBookingJob(bookingId: string, expireAt: Date) {
    const delay = expireAt.getTime() - Date.now();

    await this.bookingQueue.add(
      'expire-booking',
      { bookingId },
      {
        delay,              // ให้ job ทำงานในอนาคต
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    console.log('🕒 Expire job added for booking:', bookingId);
  }
}