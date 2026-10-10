import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CassandraService } from '../cassandra/cassandra.service';
import { Client } from 'pg';

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
        db.collection('page_views').find({}, { limit: 100 }).toArray().catch(() => []),
        db.collection('sessions').find({}, { limit: 100 }).toArray().catch(() => []),
        db.collection('visitors').find({}, { limit: 100 }).toArray().catch(() => []),
        db.collection('hotel_views').find({}, { limit: 100 }).toArray().catch(() => []),
        db.collection('search_events').find({}, { limit: 100 }).toArray().catch(() => []),
      ]);

      // Calculate device & browser breakdown
      const deviceBreakdown: Record<string, number> = {};
      const browserBreakdown: Record<string, number> = {};

      pageViews.forEach((pv: any) => {
        const device = pv.deviceType || 'Desktop';
        const browser = pv.browser || 'Chrome';
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
        browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
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
          latestPageViews: pageViews.slice(0, 15),
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

  async getPageViews() {
    const db = this.cassandraService.getDb();
    if (!db) return [];
    try {
      return await db.collection('page_views').find({}, { limit: 200 }).toArray();
    } catch (error: any) {
      this.logger.error(`Error fetching page views: ${error.message}`);
      return [];
    }
  }

  async getVisitors() {
    const db = this.cassandraService.getDb();
    if (!db) return [];
    try {
      return await db.collection('visitors').find({}, { limit: 200 }).toArray();
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

  async seedDemoData() {
    const db = this.cassandraService.getDb();
    if (!db) {
      return { success: false, message: 'Cassandra database is not connected.' };
    }

    const pages = ['/', '/hotels', '/hotels/solara-bangkok', '/hotels/hua-hin-family', '/checkout', '/user/profile'];
    const devices = ['Desktop', 'Mobile', 'Tablet'];
    const browsers = ['Chrome 128', 'Safari 18', 'Firefox 130', 'Edge 128'];
    const locations = ['Bangkok Riverside', 'Hua Hin Beach', 'Phuket Island', 'Chiang Mai City', 'Pattaya Beach'];
    const hotels = ['Solara Bangkok Riverside', 'Hua Hin Family Cabana', 'Phuket Lagoon Villas'];
    const referrers = ['https://google.com', 'https://facebook.com', 'Direct', 'https://tripadvisor.com'];

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];

    const insertedItems = [];

    for (let i = 0; i < 5; i++) {
      const eventId = this.cassandraService.generateUuid();
      const visitorId = `vis_${Math.floor(100 + Math.random() * 900)}`;
      const sessionId = `sess_${Math.floor(1000 + Math.random() * 9000)}`;
      const pagePath = pages[Math.floor(Math.random() * pages.length)];
      const deviceType = devices[Math.floor(Math.random() * devices.length)];
      const browser = browsers[Math.floor(Math.random() * browsers.length)];
      const searchLocation = locations[Math.floor(Math.random() * locations.length)];
      const hotelName = hotels[Math.floor(Math.random() * hotels.length)];
      const referrer = referrers[Math.floor(Math.random() * referrers.length)];

      await db.collection('page_views').insertOne({
        _id: eventId,
        eventId,
        pagePath,
        visitorId,
        sessionId,
        deviceType,
        browser,
        os: deviceType === 'Mobile' ? 'iOS' : 'Windows 11',
        referrer,
        timestamp,
        date: dateStr,
      });

      await db.collection('visitors').updateOne(
        { _id: visitorId },
        { $set: { visitorId, lastSeen: timestamp }, $setOnInsert: { firstSeen: timestamp } },
        { upsert: true }
      );

      await db.collection('search_events').insertOne({
        _id: `srch_${eventId}`,
        eventId: `srch_${eventId}`,
        searchLocation,
        checkInDate: '2026-11-01',
        checkOutDate: '2026-11-03',
        visitorId,
        sessionId,
        timestamp,
        date: dateStr,
      });

      await db.collection('hotel_views').insertOne({
        _id: `htl_${eventId}`,
        eventId: `htl_${eventId}`,
        hotelId: hotelName,
        visitorId,
        sessionId,
        pagePath,
        timestamp,
        date: dateStr,
      });

      insertedItems.push({ eventId, pagePath, visitorId, deviceType });
    }

    return {
      success: true,
      message: 'Generated 5 synthetic real-time telemetry events in Cassandra Astra DB!',
      sample: insertedItems,
    };
  }
}
