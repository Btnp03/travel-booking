import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CassandraService } from '../cassandra/cassandra.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, CassandraService],
  exports: [AnalyticsService, CassandraService],
})
export class AnalyticsModule {}
