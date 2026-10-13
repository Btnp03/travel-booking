"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const prisma_module_1 = require("./prisma/prisma.module");
const config_1 = require("@nestjs/config");
const hotels_module_1 = require("./hotels/hotels.module");
const rooms_module_1 = require("./rooms/rooms.module");
const inventory_module_1 = require("./inventory/inventory.module");
const search_module_1 = require("./search/search.module");
const booking_module_1 = require("./booking/booking.module");
const schedule_1 = require("@nestjs/schedule");
const redis_module_1 = require("./redis/redis.module");
const queue_module_1 = require("./queue/queue.module");
const reviews_module_1 = require("./reviews/reviews.module");
const analytics_module_1 = require("./analytics/analytics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            hotels_module_1.HotelsModule,
            rooms_module_1.RoomsModule,
            inventory_module_1.InventoryModule,
            search_module_1.SearchModule,
            booking_module_1.BookingModule,
            schedule_1.ScheduleModule.forRoot(),
            redis_module_1.RedisModule,
            queue_module_1.QueueModule,
            reviews_module_1.ReviewsModule,
            analytics_module_1.AnalyticsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map