import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

export enum ConfigTypeEnum {
  DEPOSIT = 'deposit',
  PENALTY = 'penalty',
  SERVICE_FEE = 'service_fee',
  SWAP_FEE = 'swap_fee',
  LATE_FEE = 'late_fee',
  DAMAGE_FEE = 'damage_fee',
  SYSTEM = 'system',
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

  @ApiProperty({ description: 'Numeric value of the configuration', required: false })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiProperty({ description: 'String value of the configuration (for system configs)', required: false })
  @IsString()
  @IsOptional()
  string_value?: string;

  @ApiProperty({ description: 'Description of the configuration', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
