import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataAPIClient, Db } from '@datastax/astra-db-ts';
import { Client as CassandraDriverClient, types } from 'cassandra-driver';

@Injectable()
export class CassandraService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CassandraService.name);
  private db: Db | null = null;
  private nativeClient: CassandraDriverClient | null = null;
  private isConnected = false;
  private connectionType: 'ASTRA_DATA_API' | 'NATIVE_CASSANDRA' | 'NONE' = 'NONE';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.nativeClient) {
      await this.nativeClient.shutdown();
      this.logger.log('Native Cassandra driver disconnected.');
    }
  }

  async connect(): Promise<boolean> {
    const astraToken = this.configService.get<string>('CASSANDRA_ASTRA_TOKEN');
    const astraEndpoint = this.configService.get<string>('CASSANDRA_ASTRA_ENDPOINT');
    const astraBundlePath = this.configService.get<string>('CASSANDRA_ASTRA_BUNDLE_PATH');
    
    const contactPoints = this.configService.get<string>('CASSANDRA_CONTACT_POINTS');
    const localDataCenter = this.configService.get<string>('CASSANDRA_LOCAL_DATA_CENTER', 'datacenter1');
    const keyspace = this.configService.get<string>('CASSANDRA_KEYSPACE', 'default_keyspace');

    try {
      if (astraToken && astraEndpoint) {
        this.logger.log(`Connecting to DataStax Astra DB via Data API [${astraEndpoint}]...`);
        const client = new DataAPIClient(astraToken);
        
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
        const clientOptions: any = { keyspace };

        if (astraBundlePath) {
          clientOptions.cloud = { secureConnectBundle: astraBundlePath };
          clientOptions.credentials = { username: 'token', password: astraToken };
        } else if (contactPoints) {
          clientOptions.contactPoints = contactPoints.split(',').map((cp) => cp.trim());
          clientOptions.localDataCenter = localDataCenter;
        }

        this.nativeClient = new CassandraDriverClient(clientOptions);
        await this.nativeClient.connect();

        this.isConnected = true;
        this.connectionType = 'NATIVE_CASSANDRA';
        this.logger.log(`Successfully connected to Cassandra Keyspace: [${keyspace}]`);
        return true;
      }

      this.logger.warn('No Cassandra credentials found in .env. Operating in standby mode.');
      return false;
    } catch (err: any) {
      this.logger.warn(`Could not connect to Cassandra (${err.message}). Operating in standby mode.`);
      this.isConnected = false;
      this.connectionType = 'NONE';
      return false;
    }
  }

  private async initializeAstraCollections() {
    if (!this.db) return;
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
    } catch (err: any) {
      this.logger.warn(`Notice on Astra DB collections setup: ${err.message}`);
    }
  }

  getDb(): Db | null {
    return this.db;
  }

  getNativeClient(): CassandraDriverClient | null {
    return this.nativeClient;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getConnectionType() {
    return this.connectionType;
  }

  generateUuid(): string {
    if (this.nativeClient) {
      return types.Uuid.random().toString();
    }
    return `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
