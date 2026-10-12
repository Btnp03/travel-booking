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
const cassandra_driver_1 = require("cassandra-driver");
let CassandraService = CassandraService_1 = class CassandraService {
    configService;
    logger = new common_1.Logger(CassandraService_1.name);
    db = null;
    nativeClient = null;
    isConnected = false;
    connectionType = 'NONE';
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        if (this.nativeClient) {
            await this.nativeClient.shutdown();
            this.logger.log('Native Cassandra driver disconnected.');
        }
    }
    async connect() {
        const astraToken = this.configService.get('CASSANDRA_ASTRA_TOKEN');
        const astraEndpoint = this.configService.get('CASSANDRA_ASTRA_ENDPOINT');
        const astraBundlePath = this.configService.get('CASSANDRA_ASTRA_BUNDLE_PATH');
        const contactPoints = this.configService.get('CASSANDRA_CONTACT_POINTS');
        const localDataCenter = this.configService.get('CASSANDRA_LOCAL_DATA_CENTER', 'datacenter1');
        const keyspace = this.configService.get('CASSANDRA_KEYSPACE', 'default_keyspace');
        try {
            if (astraToken && astraEndpoint) {
                this.logger.log(`Connecting to DataStax Astra DB via Data API [${astraEndpoint}]...`);
                const client = new astra_db_ts_1.DataAPIClient(astraToken);
                this.db = keyspace && keyspace !== 'default_keyspace' && keyspace !== 'travel_analytics'
                    ? client.db(astraEndpoint, { keyspace })
                    : client.db(astraEndpoint);
                this.isConnected = true;
                this.connectionType = 'ASTRA_DATA_API';
                this.logger.log(`Successfully connected to DataStax Astra DB Cloud via Data API!`);
                await this.initializeAstraCollections();
                return true;
            }
            if (astraBundlePath || contactPoints) {
                this.logger.log('Connecting via Native Cassandra Driver...');
                const clientOptions = { keyspace };
                if (astraBundlePath) {
                    clientOptions.cloud = { secureConnectBundle: astraBundlePath };
                    clientOptions.credentials = { username: 'token', password: astraToken };
                }
                else if (contactPoints) {
                    clientOptions.contactPoints = contactPoints.split(',').map((cp) => cp.trim());
                    clientOptions.localDataCenter = localDataCenter;
                }
                this.nativeClient = new cassandra_driver_1.Client(clientOptions);
                await this.nativeClient.connect();
                this.isConnected = true;
                this.connectionType = 'NATIVE_CASSANDRA';
                this.logger.log(`Successfully connected to Cassandra Keyspace: [${keyspace}]`);
                return true;
            }
            this.logger.warn('No Cassandra credentials found in .env. Operating in standby mode.');
            return false;
        }
        catch (err) {
            this.logger.warn(`Could not connect to Cassandra (${err.message}). Operating in standby mode.`);
            this.isConnected = false;
            this.connectionType = 'NONE';
            return false;
        }
    }
    async initializeAstraCollections() {
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
            this.logger.log('All 7-dimension Astra DB collections verified and ready.');
        }
        catch (err) {
            this.logger.warn(`Notice on Astra DB collections setup: ${err.message}`);
        }
    }
    getDb() {
        return this.db;
    }
    getNativeClient() {
        return this.nativeClient;
    }
    getIsConnected() {
        return this.isConnected;
    }
    getConnectionType() {
        return this.connectionType;
    }
    generateUuid() {
        if (this.nativeClient) {
            return cassandra_driver_1.types.Uuid.random().toString();
        }
        return `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
};
exports.CassandraService = CassandraService;
exports.CassandraService = CassandraService = CassandraService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CassandraService);
//# sourceMappingURL=cassandra.service.js.map