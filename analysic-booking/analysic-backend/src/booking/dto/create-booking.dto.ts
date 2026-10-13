import { IsUUID, IsDateString, IsInt, Min } from 'class-validator';


export class CreateBookingDto {
  @IsUUID()
  roomId: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsInt()
  @Min(1)
  guests: number;
}