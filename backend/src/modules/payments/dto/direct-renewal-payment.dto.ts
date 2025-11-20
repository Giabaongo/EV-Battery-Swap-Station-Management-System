import { IsNumber, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class DirectRenewalPaymentDto {
  @ApiProperty({
    description: 'ID of the expired subscription to renew',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  subscription_id: number;

  @ApiPropertyOptional({
    description: 'Payment method for direct payment',
    enum: PaymentMethod,
    default: PaymentMethod.cash,
    example: 'cash',
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod = PaymentMethod.cash;

  @ApiPropertyOptional({
    description: 'Custom order information/description',
    example: 'Gia hạn gói trực tiếp',
  })
  @IsString()
  @IsOptional()
  order_info?: string;

  @ApiPropertyOptional({
    description: 'Custom transaction ID (auto-generated if not provided)',
    example: 'DIRECT_RENEWAL_20250121123456',
  })
  @IsString()
  @IsOptional()
  transaction_id?: string;
}
