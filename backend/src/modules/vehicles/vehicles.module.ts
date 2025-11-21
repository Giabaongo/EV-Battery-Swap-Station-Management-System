import { Module, forwardRef } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { BatteriesModule } from '../batteries/batteries.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    SubscriptionsModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule { }
