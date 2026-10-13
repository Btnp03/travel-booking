import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BookingExpireService } from './booking.expire.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PrismaModule, QueueModule],
  providers: [BookingService, BookingExpireService],
  controllers: [BookingController]
})
export class BookingModule {}
