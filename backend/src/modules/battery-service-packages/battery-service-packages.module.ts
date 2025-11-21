import { Module } from '@nestjs/common';
import { BatteryServicePackagesService } from './battery-service-packages.service';
import { BatteryServicePackagesController } from './battery-service-packages.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BatteryServicePackagesController],
  providers: [BatteryServicePackagesService],
  exports: [BatteryServicePackagesService],
})
export class BatteryServicePackagesModule {}
