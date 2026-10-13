import { Controller, Get, Param, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // GET /inventory/:roomId?start=2026-05-01&end=2026-05-10
  @Get(':roomId')
  checkAvailability(
    @Param('roomId') roomId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.inventoryService.checkAvailability(roomId, start, end);
  }
}