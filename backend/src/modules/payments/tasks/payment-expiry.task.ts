import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentsService } from '../payments.service';
import { SystemConfigService } from '../../config/system-config.service';

@Injectable()
export class PaymentExpiryTask {
  private readonly logger = new Logger(PaymentExpiryTask.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  /**
   * Chạy mỗi 1 phút để check config và cancel payments nếu enabled
   * Interval thực tế được điều khiển bởi config từ database
   */
  @Cron('0 * * * * *') // Every minute
  async handleExpiredPayments() {
    try {
      // Check if feature is enabled (sync read from memory)
      const isEnabled = this.systemConfigService.getBoolean(
        'Payment_Expiry_Enabled',
        true,
      );

      if (!isEnabled) {
        this.logger.debug('Payment expiry check is disabled in config');
        return;
      }

      // Get check interval from config (in minutes) - sync read
      const intervalMinutes = this.systemConfigService.getNumber(
        'Payment_Expiry_Check_Interval',
        5,
      );

      // Simple interval control: check if current minute is divisible by interval
      const currentMinute = new Date().getMinutes();
      if (currentMinute % intervalMinutes !== 0) {
        return; // Skip this run
      }

      this.logger.log('🔍 Checking for expired payments...');

      const count = await this.paymentsService.cancelExpiredPayments();

      if (count > 0) {
        this.logger.log(`✅ Cancelled ${count} expired payment(s)`);
      } else {
        this.logger.debug('No expired payments found');
      }
    } catch (error) {
      this.logger.error('❌ Error cancelling expired payments:', error);
    }
  }
}
