import { Body, Controller, Post, Req, UseGuards ,Param, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@UseGuards(JwtAuthGuard)
@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post(":id/pay")
  pay(@Param("id") id: string, @Req() req) {
    return this.bookingService.payBooking(req.user.userId, id);
  }

      @Post()
    async create(
      @Req() req,
      @Body() dto: CreateBookingDto,
    ) {
      const userId = req.user.userId;

      return this.bookingService.createBooking(
        userId,
        dto.roomId,
        new Date(dto.checkIn),
        new Date(dto.checkOut),
        dto.guests,
      );
    }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Req() req) {
    return this.bookingService.cancelBooking(req.user.userId, id);
  }

  @Get('me')
  getMyBookings(@Req() req) {
    return this.bookingService.getMyBookings(req.user.userId);
  }

  @Get(':id')
  getBooking(@Req() req, @Param('id') id: string) {
    return this.bookingService.getBookingById(req.user.userId, id);
  }
}
