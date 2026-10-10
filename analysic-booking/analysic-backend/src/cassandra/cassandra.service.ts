import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataAPIClient, Db } from '@datastax/astra-db-ts';

@Injectable()
export class CassandraService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CassandraService.name);
  private db: Db | null = null;
  private isConnected = false;
  private connectionType: 'ASTRA_DATA_API' | 'STANDBY' = 'STANDBY';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    this.logger.log('Cassandra service destroyed.');
  }

  async connect(): Promise<boolean> {
    const astraToken = this.configService.get<string>('CASSANDRA_ASTRA_TOKEN');
    const astraEndpoint = this.configService.get<string>('CASSANDRA_ASTRA_ENDPOINT');
    const keyspace = this.configService.get<string>('CASSANDRA_KEYSPACE', 'travel_analytics');

    try {
      if (astraToken && astraEndpoint) {
        this.logger.log(`Connecting to Astra DB Cloud [${astraEndpoint}]...`);
        const client = new DataAPIClient(astraToken);
        
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
    } catch (err: any) {
      this.logger.warn(`Could not connect to Cassandra Astra DB (${err.message}). Running in standby mode.`);
      this.isConnected = false;
      this.connectionType = 'STANDBY';
      return false;
    }
  }

  private async initializeCollections() {
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
      this.logger.log('All Astra DB collections verified and ready.');
    } catch (err: any) {
      this.logger.warn(`Notice on Astra DB collections setup: ${err.message}`);
    }
  }

  getDb(): Db | null {
    return this.db;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getConnectionType() {
    return this.connectionType;
  }

  generateUuid(): string {
    return `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
