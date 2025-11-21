import { Module } from '@nestjs/common';
import { BatteryTransferRequestService } from './battery-transfer-request.service';
import { BatteryTransferRequestController } from './battery-transfer-request.controller';
import { BatteryTransferRequestGateway } from './battery-transfer-request.gateway';
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
  providers: [BatteryTransferRequestService, BatteryTransferRequestGateway],
  exports: [BatteryTransferRequestService, BatteryTransferRequestGateway],
})
export class BatteryTransferRequestModule { }
