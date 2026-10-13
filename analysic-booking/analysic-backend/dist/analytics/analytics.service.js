"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cassandra_service_1 = require("../cassandra/cassandra.service");
const pg_1 = require("pg");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor(cassandraService, configService) {
        this.cassandraService = cassandraService;
        this.configService = configService;
        this.logger = new common_1.Logger(AnalyticsService_1.name);
    }
    async getStatus() {
        let pgConnected = false;
        let pgStats = null;
        const dbUrl = this.configService.get('DATABASE_URL');
        if (dbUrl) {
            const client = new pg_1.Client({ connectionString: dbUrl });
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
            }
            catch (err) {
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
                db.collection('page_views').find({ source: 'travel-main' }, { limit: 1000 }).toArray().catch(() => []),
                db.collection('sessions').find({ source: 'travel-main' }, { limit: 1000 }).toArray().catch(() => []),
                db.collection('visitors').find({ source: 'travel-main' }, { limit: 1000 }).toArray().catch(() => []),
                db.collection('hotel_views').find({}, { limit: 1000 }).toArray().catch(() => []),
                db.collection('search_events').find({}, { limit: 1000 }).toArray().catch(() => []),
            ]);
            const sortedPageViews = [...pageViews].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
            const deviceBreakdown = {};
            const browserBreakdown = {};
            const pageBreakdown = {};
            sortedPageViews.forEach((pv) => {
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
        }
        catch (error) {
            this.logger.error(`Error building summary: ${error.message}`);
            return { isConnected: true, error: error.message, summary: null };
        }
    }
    async getPageViews() {
        const db = this.cassandraService.getDb();
        if (!db)
            return [];
        try {
            return await db.collection('page_views').find({ source: 'travel-main' }, { limit: 200 }).toArray();
        }
        catch (error) {
            this.logger.error(`Error fetching page views: ${error.message}`);
            return [];
        }
    }
    groupPageViews(pageViews, interval) {
        const counts = new Map();
        for (const pageView of pageViews) {
            const date = new Date(pageView.timestamp || pageView.date);
            if (Number.isNaN(date.getTime()))
                continue;
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
    async recordPageView(event) {
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
                db.collection('visitors').updateOne({ _id: visitorId }, { $set: { visitorId, lastSeen: timestamp, source: 'travel-main' }, $setOnInsert: { firstSeen: timestamp } }, { upsert: true }),
                db.collection('sessions').updateOne({ _id: sessionId }, { $set: { sessionId, visitorId, lastSeen: timestamp, source: 'travel-main' }, $setOnInsert: { firstSeen: timestamp } }, { upsert: true }),
            ]);
            return { success: true, eventId, timestamp };
        }
        catch (error) {
            this.logger.error(`Error recording page view: ${error.message}`);
            return { success: false, message: 'Unable to record page view.' };
        }
    }
    async getVisitors() {
        const db = this.cassandraService.getDb();
        if (!db)
            return [];
        try {
            return await db.collection('visitors').find({ source: 'travel-main' }, { limit: 200 }).toArray();
        }
        catch (error) {
            this.logger.error(`Error fetching visitors: ${error.message}`);
            return [];
        }
    }
    async getSearchEvents() {
        const db = this.cassandraService.getDb();
        if (!db)
            return [];
        try {
            return await db.collection('search_events').find({}, { limit: 200 }).toArray();
        }
        catch (error) {
            this.logger.error(`Error fetching search events: ${error.message}`);
            return [];
        }
    }
    async getHotelViews() {
        const db = this.cassandraService.getDb();
        if (!db)
            return [];
        try {
            return await db.collection('hotel_views').find({}, { limit: 200 }).toArray();
        }
        catch (error) {
            this.logger.error(`Error fetching hotel views: ${error.message}`);
            return [];
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cassandra_service_1.CassandraService,
        config_1.ConfigService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map