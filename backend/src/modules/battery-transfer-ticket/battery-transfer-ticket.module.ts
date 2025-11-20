import { Module } from '@nestjs/common';
import { BatteryTransferTicketService } from './battery-transfer-ticket.service';
import { BatteryTransferTicketController } from './battery-transfer-ticket.controller';
import { DatabaseModule } from '../database/database.module';
import { StationsModule } from '../stations/stations.module';
import { UsersModule } from '../users/users.module';
import { BatteriesModule } from '../batteries/batteries.module';
import { BatteryTransferRequestModule } from '../battery-transfer-request/battery-transfer-request.module';
import { CabinetsModule } from '../cabinets/cabinets.module';
@Module({
  imports: [
    DatabaseModule,
    StationsModule,
    UsersModule,
    BatteriesModule,
    BatteryTransferRequestModule,
    CabinetsModule,
  ],
  controllers: [BatteryTransferTicketController],
  providers: [BatteryTransferTicketService],
  exports: [BatteryTransferTicketService],
})
export class BatteryTransferTicketModule { }
