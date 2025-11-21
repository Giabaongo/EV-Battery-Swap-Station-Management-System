import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface FeeCalculation {
  subscription_fee: number;           // Phí đăng ký gói
  deposit_fee: number;                // Phí cọc pin
  overcharge_fee: number;             // Phí vượt km
  damage_fee: number;                 // Phí hư hỏng
  total_fee: number;                  // Tổng cộng
  breakdown: {
    package_price: number;            // Giá gói
    deposit_amount: number;            // Số tiền cọc
    overcharge_km: number;             // Số km vượt quá
    overcharge_cost: number;           // Chi phí vượt km
    damage_cost: number;               // Chi phí hư hỏng
  };
}

@Injectable()
export class FeeCalculationService {
  constructor(private prisma: DatabaseService) { }

  /**
   * Tính phí đăng ký gói + cọc pin (nếu chưa đặt cọc)
   * - Nếu subscription chưa đặt cọc (deposit_paid = false): Tính cả phí gói + phí cọc
   * - Nếu đã đặt cọc (deposit_paid = true): Chỉ tính phí gói
   * Phí cọc mặc định: 400,000 VNĐ
   */
  async calculateSubscriptionWithDeposit(
    packageId: number,
    subscriptionId?: number,
  ): Promise<FeeCalculation> {
    // 1. Lấy thông tin gói
    const pkg = await this.prisma.batteryServicePackage.findUnique({
      where: { package_id: packageId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // 2. Kiểm tra xem đã đặt cọc chưa
    let depositRequired = true; // Mặc định là cần đặt cọc

    if (subscriptionId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { subscription_id: subscriptionId },
      });

      if (subscription && subscription.deposit_paid) {
        depositRequired = false; // Đã đặt cọc rồi, không tính nữa
      }
    }

    // 3. Tính phí
    const depositAmount = depositRequired ? 400000 : 0;
    const totalFee = pkg.base_price.toNumber() + depositAmount;

    return {
      subscription_fee: pkg.base_price.toNumber(),
      deposit_fee: depositAmount,
      overcharge_fee: 0,
      damage_fee: 0,
      total_fee: totalFee,
      breakdown: {
        package_price: pkg.base_price.toNumber(),
        deposit_amount: depositAmount,
        overcharge_km: 0,
        overcharge_cost: 0,
        damage_cost: 0,
      },
    };
  }

  /**
   * Tính phí khi khách hàng vượt quá số km cơ bản
   * Tương tự như tiền điện - nhiều bậc phí khác nhau
   * Yêu cầu: Subscription phải đã đặt cọc (deposit_paid = true)
   */
  async calculateOverchargeFee(
    subscriptionId: number,
    actualDistanceTraveled?: number,
  ): Promise<FeeCalculation> {
    // 1. Lấy thông tin subscription
    const subscription = await this.prisma.subscription.findUnique({
      where: { subscription_id: subscriptionId },
      include: { package: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // 2. Kiểm tra đã đặt cọc chưa
    if (!subscription.deposit_paid) {
      throw new BadRequestException(
        'Bạn cần thanh toán tiền cọc trước khi tính phí vượt km. Vui lòng thanh toán phí subscription + deposit trước.',
      );
    }

    // 3. Tính km vượt quá
    const baseDistance = subscription.package?.base_distance || 0;
    const overchargeKm = Math.max(0, subscription.distance_traveled - baseDistance);

    // 4. Tính phí vượt km theo bậc (như tiền điện)
    let overchargeCost = 0;

    if (overchargeKm > 0) {
      // Lấy config phí vượt km theo bậc
      const tier1 = await this.prisma.config.findUnique({
        where: { name: 'Overcharge_Fee_Tier1' },
      });
      const tier2 = await this.prisma.config.findUnique({
        where: { name: 'Overcharge_Fee_Tier2' },
      });
      const tier3 = await this.prisma.config.findUnique({
        where: { name: 'Overcharge_Fee_Tier3' },
      });

      const tier1Price = tier1?.value?.toNumber() || 0;  // VNĐ/km
      const tier2Price = tier2?.value?.toNumber() || 0;  // VNĐ/km
      const tier3Price = tier3?.value?.toNumber() || 0;  // VNĐ/km

      console.log('🔍 Overcharge Fee Config:', {
        tier1Price,
        tier2Price,
        tier3Price,
        overchargeKm,
        baseDistance,
        distanceTraveled: subscription.distance_traveled,
      });

      // Nếu config chưa được set, sử dụng penalty_fee từ package
      if (tier1Price === 0 && tier2Price === 0 && tier3Price === 0) {
        console.warn('⚠️ Overcharge fee tiers not configured, using package penalty_fee');
        const packagePenaltyFee = subscription.package?.penalty_fee || 0;
        // Tính đơn giản: penalty_fee * (overchargeKm / baseDistance)
        overchargeCost = Math.ceil((packagePenaltyFee * overchargeKm) / baseDistance);
        console.log(`💰 Using package penalty_fee: ${packagePenaltyFee} VND, calculated: ${overchargeCost} VND`);
      } else {
        // Tính phí theo bậc (tương tự tiền điện)
        // Tier 1: 0-2000km vượt quá
        // Tier 2: 2001-4000km vượt quá
        // Tier 3: trên 4000km vượt quá

        if (overchargeKm <= 2000) {
          overchargeCost = overchargeKm * tier1Price;
        } else if (overchargeKm <= 4000) {
          overchargeCost = 2000 * tier1Price + (overchargeKm - 2000) * tier2Price;
        } else {
          overchargeCost =
            2000 * tier1Price +
            2000 * tier2Price +
            (overchargeKm - 4000) * tier3Price;
        }
        console.log(`💰 Calculated overcharge cost (tiered): ${overchargeCost} VND`);
      }
    }

    return {
      subscription_fee: 0,
      deposit_fee: 0,
      overcharge_fee: overchargeCost,
      damage_fee: 0,
      total_fee: overchargeCost,
      breakdown: {
        package_price: subscription.package?.base_price.toNumber() || 0,
        deposit_amount: 0,
        overcharge_km: overchargeKm,
        overcharge_cost: overchargeCost,
        damage_cost: 0,
      },
    };
  }

  /**
   * Tính phí hư hỏng
   */
  async calculateDamageFee(damageSeverity: 'minor' | 'moderate' | 'severe' = 'minor'): Promise<FeeCalculation> {
    let damageConfigName = 'Minor_Damage_Fee';
    if (damageSeverity === 'moderate') {
      damageConfigName = 'Battery_Damage_Penalty';
    } else if (damageSeverity === 'severe') {
      damageConfigName = 'Equipment_Loss_Penalty';
    }

    const damageConfig = await this.prisma.config.findUnique({
      where: { name: damageConfigName },
    });

    const damageCost = damageConfig?.value?.toNumber() || 0;

    return {
      subscription_fee: 0,
      deposit_fee: 0,
      overcharge_fee: 0,
      damage_fee: damageCost,
      total_fee: damageCost,
      breakdown: {
        package_price: 0,
        deposit_amount: 0,
        overcharge_km: 0,
        overcharge_cost: 0,
        damage_cost: damageCost,
      },
    };
  }

  /**
   * Tính tổng phí khi khách hàng lần đầu tiên + vượt km + hư hỏng
   */
  async calculateComplexFee(options: {
    packageId?: number;
    subscriptionId?: number;
    actualDistanceTraveled?: number;
    damageSeverity?: 'minor' | 'moderate' | 'severe';
  }): Promise<FeeCalculation> {
    let totalFee: FeeCalculation = {
      subscription_fee: 0,
      deposit_fee: 0,
      overcharge_fee: 0,
      damage_fee: 0,
      total_fee: 0,
      breakdown: {
        package_price: 0,
        deposit_amount: 0,
        overcharge_km: 0,
        overcharge_cost: 0,
        damage_cost: 0,
      },
    };

    // 1. Tính phí đăng ký + cọc nếu có packageId
    if (options.packageId) {
      const subscriptionFee = await this.calculateSubscriptionWithDeposit(
        options.packageId,
        options.subscriptionId, // Truyền subscriptionId để check đã đặt cọc chưa
      );
      totalFee.subscription_fee = subscriptionFee.subscription_fee;
      totalFee.deposit_fee = subscriptionFee.deposit_fee;
      totalFee.breakdown.package_price = subscriptionFee.breakdown.package_price;
      totalFee.breakdown.deposit_amount = subscriptionFee.breakdown.deposit_amount;
    }

    // 2. Tính phí vượt km nếu có subscriptionId và actualDistanceTraveled
    if (options.subscriptionId && options.actualDistanceTraveled) {
      const overchargeFee = await this.calculateOverchargeFee(
        options.subscriptionId,
        options.actualDistanceTraveled,
      );
      totalFee.overcharge_fee = overchargeFee.overcharge_fee;
      totalFee.breakdown.overcharge_km = overchargeFee.breakdown.overcharge_km;
      totalFee.breakdown.overcharge_cost = overchargeFee.breakdown.overcharge_cost;
    }

    // 3. Tính phí hư hỏng nếu có damageSeverity
    if (options.damageSeverity) {
      const damageFee = await this.calculateDamageFee(options.damageSeverity);
      totalFee.damage_fee = damageFee.damage_fee;
      totalFee.breakdown.damage_cost = damageFee.breakdown.damage_cost;
    }

    // 4. Tính tổng
    totalFee.total_fee =
      totalFee.subscription_fee +
      totalFee.deposit_fee +
      totalFee.overcharge_fee +
      totalFee.damage_fee;

    return totalFee;
  }

  /**
   * Get fee breakdown text (Vietnamese)
   */
  getBreakdownText(fee: FeeCalculation): string {
    const lines: string[] = [];

    if (fee.subscription_fee > 0) {
      lines.push(`Phí đăng ký gói: ${fee.subscription_fee.toLocaleString('vi-VN')} VNĐ`);
    }

    if (fee.deposit_fee > 0) {
      lines.push(`Phí cọc pin: ${fee.deposit_fee.toLocaleString('vi-VN')} VNĐ`);
    }

    if (fee.overcharge_fee > 0) {
      lines.push(
        `Phí vượt km: ${fee.breakdown.overcharge_km}km × giá tiering = ${fee.overcharge_fee.toLocaleString('vi-VN')} VNĐ`,
      );
    }

    if (fee.damage_fee > 0) {
      lines.push(`Phí hư hỏng: ${fee.damage_fee.toLocaleString('vi-VN')} VNĐ`);
    }

    lines.push(`\nTỔNG CỘNG: ${fee.total_fee.toLocaleString('vi-VN')} VNĐ`);

    return lines.join('\n');
  }
}
