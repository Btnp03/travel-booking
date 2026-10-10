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
var CassandraService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CassandraService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const astra_db_ts_1 = require("@datastax/astra-db-ts");
let CassandraService = CassandraService_1 = class CassandraService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CassandraService_1.name);
        this.db = null;
        this.isConnected = false;
        this.connectionType = 'STANDBY';
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        this.logger.log('Cassandra service destroyed.');
    }
    async connect() {
        const astraToken = this.configService.get('CASSANDRA_ASTRA_TOKEN');
        const astraEndpoint = this.configService.get('CASSANDRA_ASTRA_ENDPOINT');
        const keyspace = this.configService.get('CASSANDRA_KEYSPACE', 'travel_analytics');
        try {
            if (astraToken && astraEndpoint) {
                this.logger.log(`Connecting to Astra DB Cloud [${astraEndpoint}]...`);
                const client = new astra_db_ts_1.DataAPIClient(astraToken);
                this.db = keyspace && keyspace !== 'travel_analytics'
                    ? client.db(astraEndpoint, { keyspace })
                    : client.db(astraEndpoint);
                this.isConnected = true;
                this.connectionType = 'ASTRA_DATA_API';
                this.logger.log(`Successfully connected to DataStax Astra DB Cloud!`);
                await this.initializeCollections();
                return true;
            }
            this.logger.warn('No Cassandra credentials found in environment. Running in standby mode.');
            return false;
        }
        catch (err) {
            this.logger.warn(`Could not connect to Cassandra Astra DB (${err.message}). Running in standby mode.`);
            this.isConnected = false;
            this.connectionType = 'STANDBY';
            return false;
        }
    }
    async initializeCollections() {
        if (!this.db)
            return;
        try {
            const collections = await this.db.listCollections();
            const existingNames = collections.map((c) => c.name);
            const requiredCollections = [
                'page_views',
                'sessions',
                'visitors',
                'hotel_views',
                'search_events',
                'daily_page_counts'
            ];
            for (const colName of requiredCollections) {
                if (!existingNames.includes(colName)) {
                    this.logger.log(`Creating Astra DB collection: [${colName}]...`);
                    await this.db.createCollection(colName);
                }
            }
            this.logger.log('All Astra DB collections verified and ready.');
        }
        catch (err) {
            this.logger.warn(`Notice on Astra DB collections setup: ${err.message}`);
        }
    }
    getDb() {
        return this.db;
    }
    getIsConnected() {
        return this.isConnected;
    }
    getConnectionType() {
        return this.connectionType;
    }
    generateUuid() {
        return `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
};
exports.CassandraService = CassandraService;
exports.CassandraService = CassandraService = CassandraService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CassandraService);
//# sourceMappingURL=cassandra.service.js.map