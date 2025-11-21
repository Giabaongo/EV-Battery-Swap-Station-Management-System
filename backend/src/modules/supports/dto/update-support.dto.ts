import { PartialType } from '@nestjs/swagger';
import { CreateSupportDto } from './create-support.dto';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SupportStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSupportDto extends PartialType(CreateSupportDto) {
  @ApiProperty({ description: 'Status of the support request', enum: SupportStatus, required: false })
  @IsEnum(SupportStatus)
  @IsOptional()
  status?: SupportStatus;

  @ApiProperty({ description: 'Rating for the support request (1-5)', required: false, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({ description: 'Admin response to the support request', required: false })
  @IsString()
  @IsOptional()
  admin_respond?: string;
}

export class UpdateSupportAdminDto {
  @ApiProperty({ description: 'Status of the support request', enum: SupportStatus, required: false })
  @IsEnum(SupportStatus)
  @IsOptional()
  status?: SupportStatus;

  @ApiProperty({ description: 'Admin response to the support request', required: false })
  @IsString()
  @IsOptional()
  admin_respond?: string;
}

