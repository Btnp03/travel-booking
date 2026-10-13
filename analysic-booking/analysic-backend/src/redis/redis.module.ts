import { Module, Global, Logger } from '@nestjs/common';
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
        const host = config.get<string>('REDIS_HOST', '127.0.0.1');
        const port = config.get<number>('REDIS_PORT', 6379);
        const logger = new Logger('Redis');
        const client = new Redis({
          host,
          port,
          password: config.get('REDIS_PASSWORD') || undefined,
        });

        let connectionErrorLogged = false;
        client.on('error', (error: Error) => {
          if (connectionErrorLogged) return;
          connectionErrorLogged = true;
          logger.warn(
            `Cannot connect to Redis at ${host}:${port}. Start it with "docker compose up -d redis". ${error.message}`,
          );
        });
        client.on('ready', () => {
          connectionErrorLogged = false;
          logger.log(`Connected to Redis at ${host}:${port}`);
        });

        return client;
      },
    },
    RedisService,
    RedisLockService,
  ],
  exports: ['REDIS', RedisService, RedisLockService],
})
export class RedisModule {}