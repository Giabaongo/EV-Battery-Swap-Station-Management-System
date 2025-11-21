import { IsNumber, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePenaltyPaymentDto {
  @ApiProperty({
    description: 'ID của subscription cần thanh toán phí phạt',
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
    example: 'Thanh toán phí phạt vượt km',
  })
  @IsString()
  @IsOptional()
  order_info?: string;

  @ApiPropertyOptional({
    description: 'Custom transaction ID (auto-generated if not provided)',
    example: 'PENALTY_20250121123456',
  })
  @IsString()
  @IsOptional()
  transaction_id?: string;
}
