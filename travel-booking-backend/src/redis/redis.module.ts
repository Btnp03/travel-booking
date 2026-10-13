import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { RedisLockService } from './redis-lock.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD') || undefined,
        });
      },
    },
    RedisService,
    RedisLockService,
  ],
  exports: ['REDIS', RedisService, RedisLockService],
})
export class RedisModule {}