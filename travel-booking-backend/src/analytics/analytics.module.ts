import { Module } from '@nestjs/common';
import { CassandraService } from './cassandra.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  controllers: [AnalyticsController],
  providers: [CassandraService, AnalyticsService],
  exports: [CassandraService, AnalyticsService],
})
export class AnalyticsModule {}
