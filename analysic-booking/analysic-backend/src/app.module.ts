import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { HotelsModule } from './hotels/hotels.module';
import { RoomsModule } from './rooms/rooms.module';
import { InventoryModule } from './inventory/inventory.module';
import { SearchModule } from './search/search.module';
import { BookingModule } from './booking/booking.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    HotelsModule,
    RoomsModule,
    InventoryModule,
    SearchModule,
    BookingModule,
    ScheduleModule.forRoot(),
    RedisModule,
    QueueModule,
    ReviewsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
