import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class TrackFullTelemetryDto {
  // 1. Page View Events
  @IsString()
  pagePath: string;

  // 2. Visitor Data
  @IsString()
  visitorId: string;

  // 3. Session Data
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  // 4. Hotel View Events
  @IsOptional()
  @IsString()
  hotelId?: string;

  // 5. Device & Browser Data
  @IsOptional()
  @IsString()
  deviceType?: string; // 'Mobile' | 'Tablet' | 'Desktop'

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  os?: string;

  // 6. Traffic Source Data
  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  // 7. Search Events
  @IsOptional()
  @IsString()
  searchLocation?: string;

  @IsOptional()
  @IsString()
  checkInDate?: string;

  @IsOptional()
  @IsString()
  checkOutDate?: string;
}
