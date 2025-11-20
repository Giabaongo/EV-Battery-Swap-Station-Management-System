import { Module } from '@nestjs/common';
import { BatteryTransferRequestService } from './battery-transfer-request.service';
import { BatteryTransferRequestController } from './battery-transfer-request.controller';
import { StationsModule } from '../stations/stations.module';
import { DatabaseModule } from '../database/database.module';
import { BatteriesModule } from '../batteries/batteries.module';
import { CabinetsModule } from '../cabinets/cabinets.module';

@Module({
  imports: [
    StationsModule,
    DatabaseModule,
    BatteriesModule,
    CabinetsModule
  ],
  controllers: [BatteryTransferRequestController],
  providers: [BatteryTransferRequestService],
  exports: [BatteryTransferRequestService],
})
export class BatteryTransferRequestModule { }
