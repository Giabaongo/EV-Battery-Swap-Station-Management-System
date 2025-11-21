import { IsNumber, IsEnum, IsOptional, IsNotEmpty, Min } from 'class-validator';

export enum DamageSeverityEnum {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

/**
 * Calculate fee for subscription + deposit (if not paid yet)
 * - If subscriptionId provided: Check if deposit already paid
 * - If no subscriptionId: Assume first time, include deposit
 */
export class CalculateSubscriptionFeeDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  packageId: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  subscriptionId?: number;
}

/**
 * Calculate fee for overcharge km
 */
export class CalculateOverchargeFeeDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  subscriptionId: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  actualDistanceTraveled?: number;
}

/**
 * Calculate fee for damage
 */
export class CalculateDamageFeeDto {
  @IsEnum(DamageSeverityEnum)
  @IsOptional()
  damageSeverity?: DamageSeverityEnum = DamageSeverityEnum.MINOR;
}

/**
 * Calculate complex fee (multiple fee types)
 */
export class CalculateComplexFeeDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  packageId?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  subscriptionId?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  actualDistanceTraveled?: number;

  @IsEnum(DamageSeverityEnum)
  @IsOptional()
  damageSeverity?: DamageSeverityEnum;
}
