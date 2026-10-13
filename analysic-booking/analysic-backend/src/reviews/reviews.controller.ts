import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('booking/:id/review')
  createForBooking(
    @Req() req,
    @Param('id') bookingId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createForBooking(req.user.userId, bookingId, dto);
  }

  @Get('reviews/room/:roomId')
  findByRoom(@Param('roomId') roomId: string) {
    return this.reviewsService.findByRoom(roomId);
  }
}
