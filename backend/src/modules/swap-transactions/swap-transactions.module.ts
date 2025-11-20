import { Module } from '@nestjs/common';
import { SwapTransactionsService } from './swap-transactions.service';
import { SwapTransactionsController } from './swap-transactions.controller';
import { SwapTransactionsGateway } from './swap-transactions.gateway';
import { UsersModule } from '../users/users.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { StationsModule } from '../stations/stations.module';
import { BatteriesModule } from '../batteries/batteries.module';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    VehiclesModule,
    StationsModule,
    BatteriesModule,
    SubscriptionsModule
  ],
  controllers: [SwapTransactionsController],
  providers: [SwapTransactionsService, SwapTransactionsGateway],
  exports: [SwapTransactionsService],
})
export class SwapTransactionsModule { }
