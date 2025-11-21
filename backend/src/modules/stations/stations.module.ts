import { Module } from '@nestjs/common';
import { StationsService } from './stations.service';
import { StationsController } from './stations.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [VehiclesModule, DatabaseModule],
  controllers: [StationsController],
  providers: [StationsService],
  exports: [StationsService],
})
export class StationsModule { }
