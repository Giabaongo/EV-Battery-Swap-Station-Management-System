import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { FeeCalculationService } from './services/fee-calculation.service';
import { PaymentsController } from './payments.controller';
import { DatabaseModule } from '../database/database.module';
import { BatteryServicePackagesModule } from '../battery-service-packages/battery-service-packages.module';
import { PaymentExpiryTask } from './tasks/payment-expiry.task';

@Module({
  imports: [DatabaseModule, BatteryServicePackagesModule],
  providers: [PaymentsService, FeeCalculationService, PaymentExpiryTask],
  controllers: [PaymentsController],
  exports: [PaymentsService, FeeCalculationService],
})
export class PaymentsModule { }
