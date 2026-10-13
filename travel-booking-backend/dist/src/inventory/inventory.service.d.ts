import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    generateInventory(roomId: string, quantity: number): Promise<import("@prisma/client").Prisma.BatchPayload>;
    checkAvailability(roomId: string, start: string, end: string): Promise<{
        id: string;
        roomId: string;
        date: Date;
        available: number;
    }[]>;
}
