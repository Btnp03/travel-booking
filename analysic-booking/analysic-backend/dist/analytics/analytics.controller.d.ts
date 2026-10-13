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
            topPages?: undefined;
            activity?: undefined;
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
            topPages: {
                path: string;
                views: number;
            }[];
            activity: {
                daily: {
                    label: string;
                    views: number;
                }[];
                monthly: {
                    label: string;
                    views: number;
                }[];
                yearly: {
                    label: string;
                    views: number;
                }[];
            };
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
    recordPageView(event: Record<string, unknown>): Promise<{
        success: boolean;
        message: string;
        eventId?: undefined;
        timestamp?: undefined;
    } | {
        success: boolean;
        eventId: string;
        timestamp: string;
        message?: undefined;
    }>;
    getVisitors(): Promise<import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[]>;
    getSearchEvents(): Promise<import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[]>;
    getHotelViews(): Promise<import("@datastax/astra-db-ts").WithSim<import("@datastax/astra-db-ts").FoundDoc<import("@datastax/astra-db-ts").SomeDoc>>[]>;
}
