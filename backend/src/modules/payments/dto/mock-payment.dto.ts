import { IsInt, IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class MockPaymentDto {
  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsInt()
  @IsNotEmpty()
  package_id: number;

  @IsInt()
  @IsOptional()
  vehicle_id?: number;

  @IsEnum(['subscription', 'subscription_with_deposit', 'battery_replacement', 'damage_fee', 'other'])
  @IsOptional()
  payment_type?: string = 'subscription';

  /**
   * Optional: distance traveled (km) - dùng để tính overcharge fee
   */
  @IsNumber()
  @IsOptional()
  distance_traveled?: number;

  /**
   * Optional: damage fee type ('low', 'medium', 'high')
   */
  @IsString()
  @IsOptional()
  damage_type?: 'low' | 'medium' | 'high';

  @IsString()
  @IsOptional()
  vnp_response_code?: string; // '00' for success, '24' for cancelled, etc.

  @IsString()
  @IsOptional()
  vnp_bank_code?: string;

  @IsString()
  @IsOptional()
  vnp_card_type?: string;
}
