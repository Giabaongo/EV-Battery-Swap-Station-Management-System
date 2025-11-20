import { Module } from '@nestjs/common';
import { CabinetService } from './cabinets.service';
import { CabinetsController } from './cabinets.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CabinetsController],
  providers: [CabinetService],
  exports: [CabinetService],
})
export class CabinetsModule { }
