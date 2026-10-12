import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { RedisService } from '../redis/redis.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';
export declare class SearchService {
    private prisma;
    private inventoryService;
    private redis;
    constructor(prisma: PrismaService, inventoryService: InventoryService, redis: RedisService);
    search(dto: SearchHotelsDto): Promise<{}>;
    private startOfDay;
    private toDateKey;
}
