import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateRoomDto } from './dto/create-room.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  // ADMIN สร้างห้อง
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  // ทุกคนดูห้องของโรงแรมได้
  @Get('/hotel/:hotelId')
  getByHotel(@Param('hotelId') hotelId: string) {
    return this.roomsService.findByHotel(hotelId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.delete(id);
  }
}
