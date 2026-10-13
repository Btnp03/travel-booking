import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackFullTelemetryDto } from './dto/track-event.dto';
import type { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('status')
  getStatus() {
    return this.analyticsService.getStatus();
  }

  @Post('track')
  async trackTelemetry(@Body() dto: TrackFullTelemetryDto, @Req() req: Request) {
    return this.analyticsService.trackTelemetry(dto);
  }

  @Get('dashboard-summary')
  async getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }
}
