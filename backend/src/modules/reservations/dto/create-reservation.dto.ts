import { IsNotEmpty, IsInt, IsEnum, IsOptional, IsDate } from 'class-validator';
import { ReservationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ description: 'User ID who is making the reservation', example: 1 })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsInt({ message: 'User ID must be an integer' })
  user_id: number;

  @ApiProperty({ description: 'Vehicle ID for the reservation', example: 1 })
  @IsNotEmpty()
  @IsInt()
  vehicle_id: number;

  @ApiProperty({ description: 'Station ID where the reservation is made', example: 1 })
  @IsNotEmpty({ message: 'Station ID is required' })
  @IsInt({ message: 'Station ID must be an integer' })
  station_id: number;

  @ApiProperty({ description: 'Scheduled time for the reservation', example: '2025-12-31T23:59:59Z' })
  @IsNotEmpty({ message: 'Scheduled time is required' })
  @IsDate({ message: 'Scheduled time must be a valid date' })
  @Type(() => Date)
  scheduled_time: Date;
}
