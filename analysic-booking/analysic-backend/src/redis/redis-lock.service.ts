import { Injectable, Logger } from '@nestjs/common';
import Redlock from 'redlock';
import { RedisService } from './redis.service';

@Injectable()
export class RedisLockService {
  private redlock: Redlock;
  private logger = new Logger(RedisLockService.name);

  constructor(private redisService: RedisService) {
    this.redlock = new Redlock([this.redisService.client], {
      retryCount: 3,
      retryDelay: 200,
    });
  }

  async withLock<T>(
    resource: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const key = `lock:${resource}`;

    try {
      const lock = await this.redlock.acquire([key], ttl);
      this.logger.log(`🔒 Lock acquired ${key}`);

      try {
        return await fn();
      } finally {
        await lock.release();
        this.logger.log(`🔓 Lock released ${key}`);
      }
    } catch (err) {
      this.logger.error(`⛔ Lock failed ${key}`);
      throw err;
    }
  }
}
