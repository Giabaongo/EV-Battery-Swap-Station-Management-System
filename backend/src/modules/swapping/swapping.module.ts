import { Module } from '@nestjs/common';
import { SwappingService } from './swapping.service';
import { SwappingController } from './swapping.controller';
import { UsersModule } from '../users/users.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { BatteriesModule } from '../batteries/batteries.module';
import { StationsModule } from '../stations/stations.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DatabaseModule } from '../database/database.module';
import { SwapTransactionsModule } from '../swap-transactions/swap-transactions.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { CabinetsModule } from '../cabinets/cabinets.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    VehiclesModule,
    BatteriesModule,
    StationsModule,
    SwapTransactionsModule,
    SubscriptionsModule,
    ReservationsModule,
    CabinetsModule,
  ],
  controllers: [SwappingController],
  providers: [SwappingService],
})
export class SwappingModule { }
