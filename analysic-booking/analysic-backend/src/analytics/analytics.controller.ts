import { Controller, Get, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('status')
  getStatus() {
    return this.analyticsService.getStatus();
  }

  @Get('summary')
  getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get('page-views')
  getPageViews() {
    return this.analyticsService.getPageViews();
  }

  @Get('visitors')
  getVisitors() {
    return this.analyticsService.getVisitors();
  }

  @Get('search-events')
  getSearchEvents() {
    return this.analyticsService.getSearchEvents();
  }

  @Get('hotel-views')
  getHotelViews() {
    return this.analyticsService.getHotelViews();
  }

  @Post('seed-demo')
  seedDemoData() {
    return this.analyticsService.seedDemoData();
  }
}
