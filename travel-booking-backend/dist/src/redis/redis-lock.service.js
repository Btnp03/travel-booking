"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisLockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisLockService = void 0;
const common_1 = require("@nestjs/common");
const redlock_1 = __importDefault(require("redlock"));
const redis_service_1 = require("./redis.service");
let RedisLockService = RedisLockService_1 = class RedisLockService {
    redisService;
    redlock;
    logger = new common_1.Logger(RedisLockService_1.name);
    constructor(redisService) {
        this.redisService = redisService;
        this.redlock = new redlock_1.default([this.redisService.client], {
            retryCount: 3,
            retryDelay: 200,
        });
    }
    async withLock(resource, ttl, fn) {
        const key = `lock:${resource}`;
        try {
            const lock = await this.redlock.acquire([key], ttl);
            this.logger.log(`🔒 Lock acquired ${key}`);
            try {
                return await fn();
            }
            finally {
                await lock.release();
                this.logger.log(`🔓 Lock released ${key}`);
            }
        }
        catch (err) {
            this.logger.error(`⛔ Lock failed ${key}`);
            throw err;
        }
    }
};
exports.RedisLockService = RedisLockService;
exports.RedisLockService = RedisLockService = RedisLockService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], RedisLockService);
//# sourceMappingURL=redis-lock.service.js.map