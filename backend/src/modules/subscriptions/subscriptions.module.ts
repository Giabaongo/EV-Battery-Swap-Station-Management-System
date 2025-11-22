import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { DatabaseModule } from '../database/database.module';
import { BatteryServicePackagesModule } from '../battery-service-packages/battery-service-packages.module';
import { ConfigModule } from '@nestjs/config';
import { PaymentsModule } from '../payments/payments.module';
import { SystemConfigModule } from '../config/config.module';
import { SubscriptionExpiryTask } from './tasks/subscription-expiry.task';

@Module({
  imports: [
    DatabaseModule,
    BatteryServicePackagesModule,
    ConfigModule,
    PaymentsModule,
    SystemConfigModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionExpiryTask],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
