import { IsNotEmpty, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * DTO để tạo payment URL với integrated fee calculation
 * API này kết hợp:
 * 1. Tính toán phí (từ FeeCalculationService)
 * 2. Tạo payment record
 * 3. Tạo VNPay URL
 */
export class CreatePaymentWithFeesDto {
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  package_id: number;

  @IsNumber()
  @IsNotEmpty()
  vehicle_id: number;

  @IsEnum([
    'subscription',
    'subscription_with_deposit',
    'subscription_renewal',
    'battery_deposit',
    'battery_replacement',
    'damage_fee',
    'other'
  ])
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
  language?: string = 'vn';

  @IsString()
  @IsOptional()
  order_info?: string;
}

/**
 * Response từ Create Payment with Fees API
 */
export class PaymentWithFeesResponse {
  payment_id: number;
  paymentUrl: string;
  vnp_txn_ref: string;
  
  // Fee breakdown
  feeBreakdown: {
    baseAmount: number;           // Giá gói cơ bản
    depositFee?: number;          // Phí đặt cọc (nếu có)
    overchargeFee?: number;       // Phí vượt quá km (nếu có)
    damageFee?: number;           // Phí hư hỏng (nếu có)
    totalAmount: number;          // Tổng tiền phải thanh toán
    breakdown_text: string;       // Mô tả chi tiết
  };
  
  // Payment info
  paymentInfo: {
    user_id: number;
    package_id: number;
    vehicle_id: number;
    payment_type: string;
    status: string;
    created_at: string;
  };

  // MoMo specific extras (optional)
  momoExtras?: {
    deeplink?: string;      // Deep link for mobile app
    qrCodeUrl?: string;     // QR code URL for scanning
  };
}
