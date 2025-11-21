import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBatteryServicePackageDto {
  @ApiProperty({ description: 'Name of the battery service package', maxLength: 100 })
  @IsNotEmpty({ message: 'Package name is required' })
  @IsString({ message: 'Package name must be a string' })
  @MaxLength(100, { message: 'Package name must not exceed 100 characters' })
  name: string;

  @ApiProperty({ description: 'Base distance for the battery service package', minimum: 0 })
  @IsNotEmpty({ message: 'Base distance is required' })
  @IsInt({ message: 'Base distance must be an integer' })
  @Min(0, { message: 'Base distance must be non-negative' })
  @Type(() => Number)
  base_distance: number;

  @ApiProperty({ description: 'Base price for the battery service package', minimum: 0, type: Number, format: 'float' })
  @IsNotEmpty({ message: 'Base price is required' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Base price must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Base price must be non-negative' })
  @Type(() => Number)
  base_price: number;

  @ApiProperty({ description: 'Swap count included in the battery service package', minimum: 0 })
  @IsNotEmpty({ message: 'Swap count is required' })
  @IsInt({ message: 'Swap count must be an integer' })
  @Min(0, { message: 'Swap count must be non-negative' })
  @Type(() => Number)
  swap_count: number;

  @ApiProperty({ description: 'Penalty fee for the battery service package', minimum: 0 })
  @IsOptional()
  @IsInt({ message: 'Penalty fee must be an integer' })
  @Min(0, { message: 'Penalty fee must be non-negative' })
  @Type(() => Number)
  penalty_fee: number = 200;

  @ApiProperty({ description: 'Duration days for the battery service package', minimum: 1 })
  @IsNotEmpty({ message: 'Duration days is required' })
  @IsInt({ message: 'Duration days must be an integer' })
  @Min(1, { message: 'Duration days must be at least 1' })
  @Type(() => Number)
  duration_days: number;

  @ApiProperty({ description: 'Description of the battery service package', maxLength: 255, required: false })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;

  @ApiProperty({ description: 'Active status of the battery service package' })
  @IsNotEmpty({ message: 'Active status is required' })
  @IsBoolean({ message: 'Active must be a boolean' })
  @Type(() => Boolean)
  active: boolean;
}
