import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsUrl,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventCategory } from '../event.entity';

export class TicketTypeDto {
  @ApiProperty({ example: 'General Admission' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: '2024-12-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  saleStartDate?: string;

  @ApiPropertyOptional({ example: '2025-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  saleEndDate?: string;

  @ApiPropertyOptional({ example: 'Access to all general areas' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPerOrder?: number;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Summer Music Festival 2025' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Join us for an epic summer festival...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  description: string;

  @ApiPropertyOptional({ example: 'A brief summary of the event' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty({ enum: EventCategory })
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiProperty({ example: '2025-07-15T18:00:00Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: '2025-07-15T23:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 'Madison Square Garden' })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ example: '4 Pennsylvania Plaza, New York, NY 10001' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 40.7505 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -73.9934 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketTypeDto)
  ticketTypes?: TicketTypeDto[];

  @ApiPropertyOptional({ example: ['music', 'festival', 'summer'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  @IsOptional()
  @IsUrl()
  bannerImage?: string;

  @ApiPropertyOptional({ example: 'https://artist-website.com' })
  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;
}
