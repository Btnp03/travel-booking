import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateHotelDto } from './dto/create-hotel.dto';

@Controller('hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService) {}

  // Public — ดูโรงแรมทั้งหมด
  @Get()
  findAll() {
    return this.hotelsService.findAll();
  }

  // Public — ดูโรงแรมเดียว
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hotelsService.findOne(id);
  }

  // ADMIN only — สร้างโรงแรม
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateHotelDto) {
    return this.hotelsService.create(dto);
  }

  // ADMIN only — ลบโรงแรม
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.hotelsService.delete(id);
  }
}