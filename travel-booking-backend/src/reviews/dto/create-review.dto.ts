import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(10)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
