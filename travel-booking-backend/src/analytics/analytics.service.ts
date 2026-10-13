import { Injectable, Logger } from '@nestjs/common';
import { CassandraService } from './cassandra.service';
import { TrackFullTelemetryDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly cassandraService: CassandraService) {}

  getStatus() {
    return {
      cassandraConnected: this.cassandraService.getIsConnected(),
      connectionType: this.cassandraService.getConnectionType(),
      message: this.cassandraService.getIsConnected()
        ? `Connected to Cassandra (${this.cassandraService.getConnectionType()})`
        : 'Cassandra connection pending',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Track All 7 Specified Metrics:
   * 1. Page View Events (eventId, pagePath, timestamp)
   * 2. Visitor Data (visitorId, sessionId)
   * 3. Session Data (sessionId, startTime, endTime, durationSeconds)
   * 4. Hotel View Events (hotelId, visitorId, timestamp)
   * 5. Device & Browser Data (deviceType, browser, os)
   * 6. Traffic Source Data (referrer, utmSource, utmMedium)
   * 7. Search Events (searchLocation, checkInDate, checkOutDate, timestamp)
   */
  async trackTelemetry(dto: TrackFullTelemetryDto) {
    const timestamp = new Date();
    const isoTimestamp = timestamp.toISOString();
    const dateStr = isoTimestamp.split('T')[0];
    const eventId = this.cassandraService.generateUuid();

    const pagePath = dto.pagePath || '/';
    const visitorId = dto.visitorId || 'anon_visitor';
    const sessionId = dto.sessionId || 'anon_session';

    if (!this.cassandraService.getIsConnected()) {
      this.logger.debug(`[Standby Track] ${pagePath} | Visitor: ${visitorId}`);
      return { success: true, status: 'standby', eventId };
    }

    const type = this.cassandraService.getConnectionType();

    try {
      if (type === 'ASTRA_DATA_API') {
        const db = this.cassandraService.getDb();
        if (db) {
          // 1. Page View Record
          await db.collection('page_views').insertOne({
            _id: eventId,
            eventId,
            pagePath,
            timestamp: isoTimestamp,
            date: dateStr,
            visitorId,
            sessionId,
            deviceType: dto.deviceType || 'Desktop',
            browser: dto.browser || 'Unknown',
            os: dto.os || 'Unknown',
            referrer: dto.referrer || '',
            utmSource: dto.utmSource || '',
            utmMedium: dto.utmMedium || '',
          });

          // 2. Visitor Record
          await db.collection('visitors').updateOne(
            { _id: visitorId },
            { 
              $set: { visitorId, lastSeen: isoTimestamp },
              $setOnInsert: { firstSeen: isoTimestamp }
            },
            { upsert: true }
          );

          // 3. Session Record
          await db.collection('sessions').updateOne(
            { _id: sessionId },
            {
              $set: {
                sessionId,
                visitorId,
                endTime: dto.endTime || isoTimestamp,
                durationSeconds: dto.durationSeconds || 0,
                lastActive: isoTimestamp,
              },
              $setOnInsert: {
                startTime: dto.startTime || isoTimestamp,
              }
            },
            { upsert: true }
          );

          // 4. Hotel View Event Record (if hotelId is present)
          if (dto.hotelId) {
            await db.collection('hotel_views').insertOne({
              _id: eventId,
              eventId,
              hotelId: dto.hotelId,
              visitorId,
              sessionId,
              pagePath,
              timestamp: isoTimestamp,
              date: dateStr,
            });
          }

          // 7. Search Event Record (if search parameters are present)
          if (dto.searchLocation) {
            await db.collection('search_events').insertOne({
              _id: eventId,
              eventId,
              searchLocation: dto.searchLocation,
              checkInDate: dto.checkInDate || '',
              checkOutDate: dto.checkOutDate || '',
              visitorId,
              sessionId,
              timestamp: isoTimestamp,
              date: dateStr,
            });
          }

          // Counter for daily page views
          await db.collection('daily_page_counts').updateOne(
            { _id: `${pagePath}_${dateStr}` },
            { 
              $set: { pagePath, date: dateStr },
              $inc: { views: 1 } 
            },
            { upsert: true }
          );

          return { success: true, eventId };
        }
      }

      return { success: true, status: 'standby', eventId };
    } catch (error: any) {
      this.logger.error(`Error saving telemetry to Cassandra: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Aggregated Dashboard Summary for the other website/dashboard
   */
  async getDashboardSummary() {
    if (!this.cassandraService.getIsConnected()) {
      return {
        isConnected: false,
        message: 'Cassandra database pending configuration',
        summary: null,
      };
    }

    const type = this.cassandraService.getConnectionType();

    try {
      if (type === 'ASTRA_DATA_API') {
        const db = this.cassandraService.getDb();
        if (db) {
          const [pageViews, sessions, visitors, hotelViews, searchEvents] = await Promise.all([
            db.collection('page_views').find({}, { limit: 100 }).toArray(),
            db.collection('sessions').find({}, { limit: 100 }).toArray(),
            db.collection('visitors').find({}, { limit: 100 }).toArray(),
            db.collection('hotel_views').find({}, { limit: 100 }).toArray(),
            db.collection('search_events').find({}, { limit: 100 }).toArray(),
          ]);

          return {
            isConnected: true,
            connectionType: type,
            summary: {
              totalPageViews: pageViews.length,
              totalSessions: sessions.length,
              totalVisitors: visitors.length,
              totalHotelViews: hotelViews.length,
              totalSearchEvents: searchEvents.length,
              latestPageViews: pageViews.slice(0, 10),
              latestHotelViews: hotelViews.slice(0, 10),
              latestSearchEvents: searchEvents.slice(0, 10),
              latestSessions: sessions.slice(0, 10),
            },
          };
        }
      }

      return { isConnected: false, summary: null };
    } catch (error: any) {
      this.logger.error(`Error fetching dashboard summary: ${error.message}`);
      return { isConnected: true, error: error.message, summary: null };
    }
  }
}
