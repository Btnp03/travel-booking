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
const cassandra_service_1 = require("./cassandra.service");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    cassandraService;
    logger = new common_1.Logger(AnalyticsService_1.name);
    constructor(cassandraService) {
        this.cassandraService = cassandraService;
    }
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
    async trackTelemetry(dto) {
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
                    await db.collection('visitors').updateOne({ _id: visitorId }, {
                        $set: { visitorId, lastSeen: isoTimestamp },
                        $setOnInsert: { firstSeen: isoTimestamp }
                    }, { upsert: true });
                    await db.collection('sessions').updateOne({ _id: sessionId }, {
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
                    }, { upsert: true });
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
                    await db.collection('daily_page_counts').updateOne({ _id: `${pagePath}_${dateStr}` }, {
                        $set: { pagePath, date: dateStr },
                        $inc: { views: 1 }
                    }, { upsert: true });
                    return { success: true, eventId };
                }
            }
            return { success: true, status: 'standby', eventId };
        }
        catch (error) {
            this.logger.error(`Error saving telemetry to Cassandra: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
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
        }
        catch (error) {
            this.logger.error(`Error fetching dashboard summary: ${error.message}`);
            return { isConnected: true, error: error.message, summary: null };
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cassandra_service_1.CassandraService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map