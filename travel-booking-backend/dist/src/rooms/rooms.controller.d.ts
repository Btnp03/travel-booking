import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
export declare class RoomsController {
    private roomsService;
    constructor(roomsService: RoomsService);
    create(dto: CreateRoomDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        price: number;
        capacity: number;
        quantity: number;
        hotelId: string;
    }>;
    getByHotel(hotelId: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        name: string;
        price: number;
        capacity: number;
        quantity: number;
        hotelId: string;
    }[]>;
    getOne(id: string): import("@prisma/client").Prisma.Prisma__RoomClient<{
        id: string;
        createdAt: Date;
        name: string;
        price: number;
        capacity: number;
        quantity: number;
        hotelId: string;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__RoomClient<{
        id: string;
        createdAt: Date;
        name: string;
        price: number;
        capacity: number;
        quantity: number;
        hotelId: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
