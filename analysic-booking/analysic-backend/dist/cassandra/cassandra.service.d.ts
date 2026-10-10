import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db } from '@datastax/astra-db-ts';
export declare class CassandraService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private db;
    private isConnected;
    private connectionType;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    connect(): Promise<boolean>;
    private initializeCollections;
    getDb(): Db | null;
    getIsConnected(): boolean;
    getConnectionType(): "ASTRA_DATA_API" | "STANDBY";
    generateUuid(): string;
}
