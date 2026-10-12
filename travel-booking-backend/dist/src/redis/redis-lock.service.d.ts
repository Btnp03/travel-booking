import { RedisService } from './redis.service';
export declare class RedisLockService {
    private redisService;
    private redlock;
    private logger;
    constructor(redisService: RedisService);
    withLock<T>(resource: string, ttl: number, fn: () => Promise<T>): Promise<T>;
}
