import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionsService } from '../subscriptions.service';
import { SystemConfigService } from '../../config/system-config.service';

@Injectable()
export class SubscriptionExpiryTask {
  private readonly logger = new Logger(SubscriptionExpiryTask.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  /**
   * Run at configurable interval to check and expire subscriptions
   * Interval in minutes configured via system config
   * Default: every 60 minutes (1 hour)
   * 
   * The cron runs every minute, but only executes the actual check
   * when the configured interval has passed
   */
  @Cron('0 * * * * *') // Run every minute
  async handleExpiredSubscriptions() {
    try {
      // Check if feature is enabled
      const isEnabled = this.systemConfigService.getBoolean(
        'Subscription_Expiry_Enabled',
        true,
      );

      if (!isEnabled) {
        return;
      }

      // Get interval in minutes from config
      const intervalMinutes = this.systemConfigService.getNumber(
        'Subscription_Expiry_Check_Interval_Minutes',
        60, // Default: 1 hour
      );

      // Check if we should run based on last run time
      const lastRunKey = 'subscription_expiry_last_run';
      const lastRun = await this.getLastRunTime(lastRunKey);
      const now = new Date();

      if (lastRun) {
        const minutesSinceLastRun = Math.floor(
          (now.getTime() - lastRun.getTime()) / 60000,
        );

        if (minutesSinceLastRun < intervalMinutes) {
          // Not time to run yet
          return;
        }
      }

      this.logger.log(
        `🔍 Checking for expired subscriptions... (Interval: ${intervalMinutes} minutes)`,
      );

      const result =
        await this.subscriptionsService.updateExpiredSubscriptions();

      // Save last run time
      await this.saveLastRunTime(lastRunKey, now);

      if (result.count > 0) {
        this.logger.log(
          `✅ Successfully expired ${result.count} subscription(s)`,
        );

        // Log details
        result.subscriptions.forEach((sub) => {
          this.logger.log(
            `   - Subscription #${sub.subscription_id} (User: ${sub.username}, Package: ${sub.package_name})`,
          );
        });
      } else {
        this.logger.log('✅ No expired subscriptions found');
      }
    } catch (error) {
      this.logger.error(
        `❌ Error checking expired subscriptions: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get last run time from system config
   */
  private async getLastRunTime(key: string): Promise<Date | null> {
    try {
      const value = this.systemConfigService.getString(key, '');
      return value ? new Date(value) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save last run time to system config
   */
  private async saveLastRunTime(key: string, time: Date): Promise<void> {
    try {
      await this.systemConfigService.updateConfig(key, time.toISOString());
    } catch (error) {
      this.logger.warn(
        `Failed to save last run time for ${key}: ${error.message}`,
      );
    }
  }
}
