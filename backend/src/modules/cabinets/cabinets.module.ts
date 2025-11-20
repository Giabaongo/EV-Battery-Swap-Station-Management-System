import { Module } from '@nestjs/common';
import { CabinetsService } from './cabinets.service';
import { CabinetsController } from './cabinets.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CabinetsController],
  providers: [CabinetsService],
  exports: [CabinetsService],
})
export class CabinetsModule { }
