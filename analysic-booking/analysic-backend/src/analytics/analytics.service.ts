import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CassandraService } from '../cassandra/cassandra.service';
import { Client } from 'pg';
import { TrackFullTelemetryDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly cassandraService: CassandraService,
    private readonly configService: ConfigService,
  ) {}

  async getStatus() {
    let pgConnected = false;
    let pgStats = null;

    const dbUrl = this.configService.get<string>('DATABASE_URL');
    if (dbUrl) {
      const client = new Client({ connectionString: dbUrl });
      try {
        await client.connect();
        const res = await client.query(`
          SELECT 
            (SELECT COUNT(*) FROM "User") as users,
            (SELECT COUNT(*) FROM "Hotel") as hotels,
            (SELECT COUNT(*) FROM "Booking") as bookings,
            (SELECT COALESCE(SUM(total), 0) FROM "Booking") as revenue
        `);
        pgConnected = true;
        pgStats = res.rows[0];
        await client.end();
      } catch (err: any) {
        this.logger.warn(`PostgreSQL query failed: ${err.message}`);
      }
    }

    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      cassandraConnected: this.cassandraService.getIsConnected(),
      connectionType: this.cassandraService.getConnectionType(),
      message: this.cassandraService.getIsConnected()
        ? `Connected to Cassandra (${this.cassandraService.getConnectionType()})`
        : 'Cassandra connection pending',
      cassandra: {
        connected: this.cassandraService.getIsConnected(),
        type: this.cassandraService.getConnectionType(),
      },
      postgres: {
        connected: pgConnected,
        stats: pgStats,
      },
    };
  }

  async getDashboardSummary() {
    const status = await this.getStatus();
    const isCassandraConnected = this.cassandraService.getIsConnected();

    if (!isCassandraConnected) {
      return {
        isConnected: false,
        message: 'Astra DB Cassandra is currently in standby or disconnected.',
        postgres: status.postgres,
        summary: {
          totalPageViews: 0,
          totalSessions: 0,
          totalVisitors: 0,
          totalHotelViews: 0,
          totalSearchEvents: 0,
          latestPageViews: [],
          latestHotelViews: [],
          latestSearchEvents: [],
          deviceBreakdown: {},
          browserBreakdown: {},
        },
      };
    }

    const db = this.cassandraService.getDb();
    if (!db) {
      return { isConnected: false, summary: null };
    }

    try {
      const [pageViews, sessions, visitors, hotelViews, searchEvents] = await Promise.all([
        db.collection('page_views').find({ source: 'travel-main' }, { limit: 1000 }).toArray().catch(() => []),
        db.collection('sessions').find({ source: 'travel-main' }, { limit: 1000 }).toArray().catch(() => []),
        db.collection('visitors').find({ source: 'travel-main' }, { limit: 1000 }).toArray().catch(() => []),
        db.collection('hotel_views').find({}, { limit: 1000 }).toArray().catch(() => []),
        db.collection('search_events').find({}, { limit: 1000 }).toArray().catch(() => []),
      ]);

      const sortedPageViews = [...pageViews].sort(
        (a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime(),
      );

      // Calculate device & browser breakdown
      const deviceBreakdown: Record<string, number> = {};
      const browserBreakdown: Record<string, number> = {};
      const pageBreakdown: Record<string, number> = {};

      sortedPageViews.forEach((pv: any) => {
        const device = pv.deviceType || 'Desktop';
        const browser = pv.browser || 'Chrome';
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
        browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
        const path = pv.pagePath || '/';
        pageBreakdown[path] = (pageBreakdown[path] || 0) + 1;
      });

      return {
        isConnected: true,
        connectionType: this.cassandraService.getConnectionType(),
        postgres: status.postgres,
        summary: {
          totalPageViews: pageViews.length,
          totalSessions: sessions.length,
          totalVisitors: visitors.length,
          totalHotelViews: hotelViews.length,
          totalSearchEvents: searchEvents.length,
          deviceBreakdown,
          browserBreakdown,
          topPages: Object.entries(pageBreakdown)
            .map(([path, views]) => ({ path, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5),
          activity: {
            daily: this.groupPageViews(sortedPageViews, 'day'),
            monthly: this.groupPageViews(sortedPageViews, 'month'),
            yearly: this.groupPageViews(sortedPageViews, 'year'),
          },
          latestPageViews: sortedPageViews.slice(0, 15),
          latestHotelViews: hotelViews.slice(0, 10),
          latestSearchEvents: searchEvents.slice(0, 10),
          latestSessions: sessions.slice(0, 10),
        },
      };
    } catch (error: any) {
      this.logger.error(`Error building summary: ${error.message}`);
      return { isConnected: true, error: error.message, summary: null };
    }
  }

  async trackTelemetry(dto: TrackFullTelemetryDto) {
    const timestamp = new Date().toISOString();
    const date = timestamp.slice(0, 10);
    const eventId = this.cassandraService.generateUuid();
    const pagePath = dto.pagePath || '/';
    const visitorId = dto.visitorId || 'anon_visitor';
    const sessionId = dto.sessionId || 'anon_session';
    const db = this.cassandraService.getDb();

    if (!this.cassandraService.getIsConnected() || !db || this.cassandraService.getConnectionType() !== 'ASTRA_DATA_API') {
      this.logger.debug(`[Standby Track] ${pagePath} | Visitor: ${visitorId}`);
      return { success: true, status: 'standby', eventId };
    }

    try {
      await db.collection('page_views').insertOne({
        _id: eventId,
        eventId,
        pagePath,
        timestamp,
        date,
        visitorId,
        sessionId,
        deviceType: dto.deviceType || 'Desktop',
        browser: dto.browser || 'Unknown',
        os: dto.os || 'Unknown',
        referrer: dto.referrer || '',
        utmSource: dto.utmSource || '',
        utmMedium: dto.utmMedium || '',
        source: 'travel-main',
      });

      await Promise.all([
        db.collection('visitors').updateOne(
          { _id: visitorId },
          {
            $set: { visitorId, lastSeen: timestamp, source: 'travel-main' },
            $setOnInsert: { firstSeen: timestamp },
          },
          { upsert: true },
        ),
        db.collection('sessions').updateOne(
          { _id: sessionId },
          {
            $set: {
              sessionId,
              visitorId,
              endTime: dto.endTime || timestamp,
              durationSeconds: dto.durationSeconds || 0,
              lastActive: timestamp,
              source: 'travel-main',
            },
            $setOnInsert: { startTime: dto.startTime || timestamp },
          },
          { upsert: true },
        ),
      ]);

      if (dto.hotelId) {
        await db.collection('hotel_views').insertOne({
          _id: eventId,
          eventId,
          hotelId: dto.hotelId,
          visitorId,
          sessionId,
          pagePath,
          timestamp,
          date,
          source: 'travel-main',
        });
      }

      if (dto.searchLocation) {
        await db.collection('search_events').insertOne({
          _id: eventId,
          eventId,
          searchLocation: dto.searchLocation,
          checkInDate: dto.checkInDate || '',
          checkOutDate: dto.checkOutDate || '',
          visitorId,
          sessionId,
          timestamp,
          date,
          source: 'travel-main',
        });
      }

      await db.collection('daily_page_counts').updateOne(
        { _id: `${pagePath}_${date}` },
        { $set: { pagePath, date }, $inc: { views: 1 } },
        { upsert: true },
      );

      return { success: true, eventId };
    } catch (error: any) {
      this.logger.error(`Error saving telemetry to Cassandra: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getPageViews() {
    const db = this.cassandraService.getDb();
    if (!db) return [];
    try {
      return await db.collection('page_views').find({ source: 'travel-main' }, { limit: 200 }).toArray();
    } catch (error: any) {
      this.logger.error(`Error fetching page views: ${error.message}`);
      return [];
    }
  }

  private groupPageViews(pageViews: any[], interval: 'day' | 'month' | 'year') {
    const counts = new Map<string, number>();
    for (const pageView of pageViews) {
      const date = new Date(pageView.timestamp || pageView.date);
      if (Number.isNaN(date.getTime())) continue;
      const key = interval === 'day'
        ? date.toISOString().slice(0, 10)
        : interval === 'month'
          ? date.toISOString().slice(0, 7)
          : String(date.getUTCFullYear());
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, views]) => ({ label, views }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-12);
  }

  async recordPageView(event: Record<string, unknown>) {
    const db = this.cassandraService.getDb();
    if (!db) {
      return { success: false, message: 'Cassandra database is not connected.' };
    }

    const pagePath = typeof event.pagePath === 'string' ? event.pagePath.slice(0, 500) : '/';
    const visitorId = typeof event.visitorId === 'string' ? event.visitorId.slice(0, 120) : 'anonymous';
    const sessionId = typeof event.sessionId === 'string' ? event.sessionId.slice(0, 120) : 'unknown';
    const timestamp = new Date().toISOString();
    const eventId = this.cassandraService.generateUuid();
    const deviceType = typeof event.deviceType === 'string' ? event.deviceType.slice(0, 40) : 'Unknown';
    const browser = typeof event.browser === 'string' ? event.browser.slice(0, 80) : 'Unknown';
    const referrer = typeof event.referrer === 'string' ? event.referrer.slice(0, 500) : 'Direct';

    try {
      await db.collection('page_views').insertOne({
        _id: eventId,
        eventId,
        pagePath,
        visitorId,
        sessionId,
        deviceType,
        browser,
        referrer,
        source: 'travel-main',
        timestamp,
        date: timestamp.slice(0, 10),
      });

      await Promise.all([
        db.collection('visitors').updateOne(
          { _id: visitorId },
          { $set: { visitorId, lastSeen: timestamp, source: 'travel-main' }, $setOnInsert: { firstSeen: timestamp } },
          { upsert: true },
        ),
        db.collection('sessions').updateOne(
          { _id: sessionId },
          { $set: { sessionId, visitorId, lastSeen: timestamp, source: 'travel-main' }, $setOnInsert: { firstSeen: timestamp } },
          { upsert: true },
        ),
      ]);

      return { success: true, eventId, timestamp };
    } catch (error: any) {
      this.logger.error(`Error recording page view: ${error.message}`);
      return { success: false, message: 'Unable to record page view.' };
    }
  }

  async getVisitors() {
    const db = this.cassandraService.getDb();
    if (!db) return [];
    try {
      return await db.collection('visitors').find({ source: 'travel-main' }, { limit: 200 }).toArray();
    } catch (error: any) {
      this.logger.error(`Error fetching visitors: ${error.message}`);
      return [];
    }
  }

  async getSearchEvents() {
    const db = this.cassandraService.getDb();
    if (!db) return [];
    try {
      return await db.collection('search_events').find({}, { limit: 200 }).toArray();
    } catch (error: any) {
      this.logger.error(`Error fetching search events: ${error.message}`);
      return [];
    }
  }

  async getHotelViews() {
    const db = this.cassandraService.getDb();
    if (!db) return [];
    try {
      return await db.collection('hotel_views').find({}, { limit: 200 }).toArray();
    } catch (error: any) {
      this.logger.error(`Error fetching hotel views: ${error.message}`);
      return [];
    }
  }

}
