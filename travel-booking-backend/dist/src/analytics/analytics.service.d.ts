import { CassandraService } from './cassandra.service';
import { TrackFullTelemetryDto } from './dto/track-event.dto';
export declare class AnalyticsService {
    private readonly cassandraService;
    private readonly logger;
    constructor(cassandraService: CassandraService);
    getStatus(): {
        cassandraConnected: boolean;
        connectionType: "ASTRA_DATA_API" | "NATIVE_CASSANDRA" | "NONE";
        message: string;
        timestamp: string;
    };
    trackTelemetry(dto: TrackFullTelemetryDto): Promise<{
        success: boolean;
        status: string;
        eventId: string;
        error?: undefined;
    } | {
        success: boolean;
        eventId: string;
        status?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        status?: undefined;
        eventId?: undefined;
    }>;
    getDashboardSummary(): Promise<{
        isConnected: boolean;
        message: string;
        summary: null;
        connectionType?: undefined;
        error?: undefined;
    } | {
        isConnected: boolean;
        connectionType: "ASTRA_DATA_API";
        summary: {
            totalPageViews: number;
            totalSessions: number;
            totalVisitors: number;
            totalHotelViews: number;
            totalSearchEvents: number;
            latestPageViews: import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[];
            latestHotelViews: import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[];
            latestSearchEvents: import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[];
            latestSessions: import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[];
        };
        message?: undefined;
        error?: undefined;
    } | {
        isConnected: boolean;
        summary: null;
        message?: undefined;
        connectionType?: undefined;
        error?: undefined;
    } | {
        isConnected: boolean;
        error: any;
        summary: null;
        message?: undefined;
        connectionType?: undefined;
    }>;
}
