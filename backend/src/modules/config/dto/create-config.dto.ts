import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

export enum ConfigTypeEnum {
  DEPOSIT = 'deposit',
  PENALTY = 'penalty',
  SERVICE_FEE = 'service_fee',
  SWAP_FEE = 'swap_fee',
  LATE_FEE = 'late_fee',
  DAMAGE_FEE = 'damage_fee',
  OTHER = 'other',
}

export class CreateConfigDto {
  @ApiProperty({ description: 'Type of the configuration', enum: ConfigTypeEnum })
  @IsEnum(ConfigTypeEnum)
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Name of the configuration' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Value of the configuration' })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({ description: 'Description of the configuration', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
