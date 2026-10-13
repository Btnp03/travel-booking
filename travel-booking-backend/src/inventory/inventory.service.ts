import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // create availability 365 วัน หลังสร้าง room
  async generateInventory(roomId: string, quantity: number) {
  const days = 365;
  const today = new Date();

  const data: any[] = []; 

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    data.push({
      roomId: roomId,
      date: date,          // 👈 Prisma รับ Date object ได้
      available: quantity,
    });
  }

  return this.prisma.roomInventory.createMany({
    data,
  });
}

  // ดูห้องว่างตามช่วงวันที่
  async checkAvailability(roomId: string, start: string, end: string) {
    return this.prisma.roomInventory.findMany({
      where: {
        roomId,
        date: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      orderBy: { date: 'asc' },
    });
  }
}