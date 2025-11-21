import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { DatabaseModule } from '../database/database.module';
import { BatteriesModule } from '../batteries/batteries.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StationsModule } from '../stations/stations.module';
import { CabinetsModule } from '../cabinets/cabinets.module';
import { ReservationsGateway } from './reservations.gateway';

@Module({
  imports: [BatteriesModule, DatabaseModule, VehiclesModule, UsersModule, SubscriptionsModule, StationsModule, CabinetsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsGateway],
  exports: [ReservationsService],
})
export class ReservationsModule { }
