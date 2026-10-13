import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private inventoryService;
    constructor(inventoryService: InventoryService);
    checkAvailability(roomId: string, start: string, end: string): Promise<{
        id: string;
        roomId: string;
        date: Date;
        available: number;
    }[]>;
}
