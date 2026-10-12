import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateRoomDto } from './dto/create-room.dto';
export declare class RoomsService {
    private prisma;
    private inventoryService;
    constructor(prisma: PrismaService, inventoryService: InventoryService);
    create(dto: CreateRoomDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        price: number;
        capacity: number;
        quantity: number;
        hotelId: string;
    }>;
    findByHotel(hotelId: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        name: string;
        price: number;
        capacity: number;
        quantity: number;
        hotelId: string;
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__RoomClient<{
        id: string;
        createdAt: Date;
        name: string;
        price: number;
        capacity: number;
        quantity: number;
        hotelId: string;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    delete(id: string): import("@prisma/client").Prisma.Prisma__RoomClient<{
        id: string;
        createdAt: Date;
        name: string;
        price: number;
        capacity: number;
        quantity: number;
        hotelId: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
