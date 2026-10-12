import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SearchHotelsDto {
  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests: number;

  @IsOptional()
  @IsString()
  stayStyle?: string;
}
