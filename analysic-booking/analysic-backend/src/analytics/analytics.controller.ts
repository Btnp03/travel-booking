import { Body, Controller, Get, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackFullTelemetryDto } from './dto/track-event.dto';

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

  @Get('dashboard-summary')
  getLegacyDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  @Post('track')
  trackTelemetry(@Body() dto: TrackFullTelemetryDto) {
    return this.analyticsService.trackTelemetry(dto);
  }

  @Get('page-views')
  getPageViews() {
    return this.analyticsService.getPageViews();
  }

  /**
   * Public telemetry endpoint for the travel site.  Call this whenever a
   * visitor opens a route; the API supplies the event id and timestamp.
   */
  @Post('page-views')
  recordPageView(@Body() event: Record<string, unknown>) {
    return this.analyticsService.recordPageView(event);
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

}
