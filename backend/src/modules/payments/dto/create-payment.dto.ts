import { IsInt, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export enum PaymentTypeEnum {
  SUBSCRIPTION = 'subscription',
  SUBSCRIPTION_WITH_DEPOSIT = 'subscription_with_deposit',
  BATTERY_DEPOSIT = 'battery_deposit',
  BATTERY_REPLACEMENT = 'battery_replacement',
  DAMAGE_FEE = 'damage_fee',
  OTHER = 'other',
}

export class CreatePaymentDto {
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsInt()
  @IsOptional()
  package_id?: number;

  @IsInt()
  @IsOptional()
  vehicle_id?: number;

  @IsString()
  @IsOptional()
  orderDescription?: string;

  @IsEnum(PaymentTypeEnum)
  @IsOptional()
  payment_type: PaymentTypeEnum = PaymentTypeEnum.SUBSCRIPTION;

  @IsString()
  @IsOptional()
  language?: string; // 'vn' or 'en'
}
