import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Processor('booking')
export class BookingProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    if (job.name === 'expire-booking') {
      const { bookingId } = job.data;

      console.log('⏰ Processing expire booking:', bookingId);

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
      });

      // ถ้า user จ่ายเงินแล้ว → ไม่ต้องทำอะไร
      if (!booking || booking.status !== 'PENDING') {
        console.log('✅ Booking already paid/cancelled');
        return;
      }

      // เปลี่ยนสถานะเป็น CANCELLED
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
      });

      console.log('❌ Booking expired & cancelled:', bookingId);

      // clear search cache
      await this.redis.clearByPrefix('search:');
    }
  }
}