import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService,private inventoryService: InventoryService,) {}

  async create(dto: CreateRoomDto) {
    const room = await this.prisma.room.create({ data: dto });

  // เรียก InventoryService หลังสร้างห้อง
    await this.inventoryService.generateInventory(
    room.id,
    room.quantity,
  );

  return room;
  }

  findByHotel(hotelId: string) {
    return this.prisma.room.findMany({
      where: { hotelId },
    });
  }

  findOne(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
    });
  }

  delete(id: string) {
    return this.prisma.room.delete({
      where: { id },
    });
  }
}
