import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';

// ✅ Tạo enum thay vì const array
export enum PaymentTypeEnum {
  SUBSCRIPTION = 'subscription',
  SUBSCRIPTION_WITH_DEPOSIT = 'subscription_with_deposit',
  BATTERY_REPLACEMENT = 'battery_replacement',
  DAMAGE_FEE = 'damage_fee',
  OTHER = 'other',
}

export class CreateDirectPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  package_id: number;

  @IsNumber()
  @IsNotEmpty()
  vehicle_id: number;

  @IsEnum(PaymentTypeEnum, {
    message: `payment_type must be one of the following values: ${Object.values(PaymentTypeEnum).join(', ')}`,
  })
  @IsOptional()
  payment_type?: PaymentTypeEnum = PaymentTypeEnum.SUBSCRIPTION;

  /**
   * Optional: distance traveled (km) - dùng để tính overcharge fee
   */
  @IsNumber()
  @IsOptional()
  distance_traveled?: number;

  @IsString()
  @IsOptional()
  order_info?: string;
}