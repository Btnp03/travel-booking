import { OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit {
    private readonly redis;
    constructor(redis: Redis);
    onModuleInit(): Promise<void>;
    getCache<T>(key: string): Promise<T | null>;
    setCache(key: string, value: any, ttlSeconds?: number): Promise<void>;
    deleteByPrefix(prefix: string): Promise<void>;
    clearByPrefix(prefix: string): Promise<void>;
    get client(): Redis;
}
