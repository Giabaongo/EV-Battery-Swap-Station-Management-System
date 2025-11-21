import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ConfigTypeEnum } from './create-config.dto';

export class UpdateConfigDto {
  @IsEnum(ConfigTypeEnum)
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
