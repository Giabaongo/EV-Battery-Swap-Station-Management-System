import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { SupportType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupportDto {
  @ApiProperty({ description: 'ID of the user creating the support request' })
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ description: 'ID of the station related to the support request', required: false })
  @IsInt()
  @IsOptional()
  station_id?: number;

  @ApiProperty({ description: 'Type of support request', enum: SupportType })
  @IsEnum(SupportType)
  @IsNotEmpty()
  type: SupportType;

  @ApiProperty({ description: 'Description of the support request' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Rating for the support request (1-5)', required: false, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;
}

