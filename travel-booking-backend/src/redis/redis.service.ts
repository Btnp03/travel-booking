import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async onModuleInit() {
    try {
      const pong = await this.redis.ping();
      console.log('[Redis] Connected:', pong);
    } catch (err) {
      console.error('[Redis] Connection failed', err);
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    console.log(`[Redis] GET ${key} -> ${data ? 'hit' : 'miss'}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  async setCache(key: string, value: any, ttlSeconds = 60) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    console.log(`[Redis] SET ${key} ttl=${ttlSeconds}s`);
  }

  async deleteByPrefix(prefix: string) {
    const keys = await this.redis.keys(`${prefix}*`);
    console.log(`[Redis] CLEAR prefix=${prefix} matched=${keys.length}`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async clearByPrefix(prefix: string) {
    const keys = await this.client.keys(`${prefix}*`);

    if (keys.length === 0) return;

    await this.client.del(...keys);
    console.log(`[Redis] CLEAR prefix=${prefix} matched=${keys.length}`);
  }

  get client() {
    return this.redis;
  }
}
