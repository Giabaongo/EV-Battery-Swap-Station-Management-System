import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-statistics.controller';
import { AdminDashboardService } from './admin-statistics.service';
import { DatabaseModule } from '../database/database.module';
import { StationsModule } from '../stations/stations.module';
import { BatteryTransferRequestModule } from '../battery-transfer-request/battery-transfer-request.module';

@Module({
  imports: [DatabaseModule, StationsModule, BatteryTransferRequestModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule { }
