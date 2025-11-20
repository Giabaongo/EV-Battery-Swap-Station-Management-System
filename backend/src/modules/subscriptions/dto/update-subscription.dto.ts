import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class UpdateSubscriptionDto {
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsInt()
  @IsOptional()
  swap_used?: number;

  @IsOptional()
  battery_id?: number | null;
}

