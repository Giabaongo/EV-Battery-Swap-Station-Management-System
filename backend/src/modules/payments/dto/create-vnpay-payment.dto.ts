import { IsNotEmpty, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';

export enum PaymentTypeEnum {
  SUBSCRIPTION = 'subscription',
  SUBSCRIPTION_WITH_DEPOSIT = 'subscription_with_deposit',
  BATTERY_DEPOSIT = 'battery_deposit',
  BATTERY_REPLACEMENT = 'battery_replacement',
  DAMAGE_FEE = 'damage_fee',
  OTHER = 'other',
}

export class CreateVnpayPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  package_id: number;

  @IsNumber()
  @IsOptional()
  vehicle_id?: number;

  @IsEnum(PaymentTypeEnum)
  @IsOptional()
  payment_type: PaymentTypeEnum = PaymentTypeEnum.SUBSCRIPTION;

  @IsString()
  @IsOptional()
  order_info?: string;
}
