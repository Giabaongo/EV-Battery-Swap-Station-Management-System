import {
  IsNotEmpty,
  IsString,
  MaxLength,
  Length,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Vehicle Identification Number', maxLength: 18 })
  @IsNotEmpty({ message: 'VIN is required' })
  @IsString({ message: 'VIN must be a string' })
  @Length(11, 18, { message: 'VIN must be between 11 and 18 characters' })
  vin: string;

  @ApiProperty({ description: 'Vehicle make', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Battery model must be a string' })
  @MaxLength(50, { message: 'Battery model must not exceed 50 characters' })
  battery_model: string = 'EV Model 1';

  @ApiProperty({ description: 'Vehicle battery type', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'Battery type must be a string' })
  @MaxLength(50, { message: 'Battery type must not exceed 50 characters' })
  battery_type: string = 'Lithium-ion';
}
