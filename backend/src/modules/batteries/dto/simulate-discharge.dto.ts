import { IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

/**
 * DTO để giả lập driver di chuyển (discharge battery)
 * Giảm current_charge của battery để simulate sử dụng
 */
export class SimulateBatteryDischargeDto {
  @IsNumber()
  @IsNotEmpty()
  battery_id: number;

  /**
   * New charge percentage (0-100)
   * Nếu không cung cấp, sẽ giảm ngẫu nhiên 5-20%
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  new_charge?: number;

  /**
   * Amount to decrease (0-100)
   * Alternative to new_charge
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  decrease_amount?: number;
}

/**
 * DTO để set charge cụ thể (cho admin)
 */
export class SetBatteryChargeDto {
  @IsNumber()
  @IsNotEmpty()
  battery_id: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  charge_percentage: number;
}
