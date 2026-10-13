import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db } from '@datastax/astra-db-ts';
import { Client as CassandraDriverClient } from 'cassandra-driver';
export declare class CassandraService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private db;
    private nativeClient;
    private isConnected;
    private connectionType;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    connect(): Promise<boolean>;
    private initializeAstraCollections;
    getDb(): Db | null;
    getNativeClient(): CassandraDriverClient | null;
    getIsConnected(): boolean;
    getConnectionType(): "ASTRA_DATA_API" | "NATIVE_CASSANDRA" | "NONE";
    generateUuid(): string;
}
