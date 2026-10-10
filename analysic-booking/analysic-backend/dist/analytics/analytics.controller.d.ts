import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getStatus(): Promise<{
        status: string;
        timestamp: string;
        cassandra: {
            connected: boolean;
            type: "ASTRA_DATA_API" | "STANDBY";
        };
        postgres: {
            connected: boolean;
            stats: any;
        };
    }>;
    getDashboardSummary(): Promise<{
        isConnected: boolean;
        message: string;
        postgres: {
            connected: boolean;
            stats: any;
        };
        summary: {
            totalPageViews: number;
            totalSessions: number;
            totalVisitors: number;
            totalHotelViews: number;
            totalSearchEvents: number;
            latestPageViews: any[];
            latestHotelViews: any[];
            latestSearchEvents: any[];
            deviceBreakdown: {};
            browserBreakdown: {};
            latestSessions?: undefined;
        };
        connectionType?: undefined;
        error?: undefined;
    } | {
        isConnected: boolean;
        summary: any;
        message?: undefined;
        postgres?: undefined;
        connectionType?: undefined;
        error?: undefined;
    } | {
        isConnected: boolean;
        connectionType: "ASTRA_DATA_API" | "STANDBY";
        postgres: {
            connected: boolean;
            stats: any;
        };
        summary: {
            totalPageViews: number;
            totalSessions: number;
            totalVisitors: number;
            totalHotelViews: number;
            totalSearchEvents: number;
            deviceBreakdown: Record<string, number>;
            browserBreakdown: Record<string, number>;
            latestPageViews: any[];
            latestHotelViews: any[];
            latestSearchEvents: any[];
            latestSessions: any[];
        };
        message?: undefined;
        error?: undefined;
    } | {
        isConnected: boolean;
        error: any;
        summary: any;
        message?: undefined;
        postgres?: undefined;
        connectionType?: undefined;
    }>;
    getPageViews(): Promise<import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[]>;
    getVisitors(): Promise<import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[]>;
    getSearchEvents(): Promise<import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[]>;
    getHotelViews(): Promise<import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[]>;
    seedDemoData(): Promise<{
        success: boolean;
        message: string;
        sample?: undefined;
    } | {
        success: boolean;
        message: string;
        sample: any[];
    }>;
}
