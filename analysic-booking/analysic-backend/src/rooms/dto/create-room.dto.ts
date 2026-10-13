import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsUUID()
  hotelId: string;
}
