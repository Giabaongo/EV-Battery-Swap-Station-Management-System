import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiService } from './services/gemini.service';
import { StationAnalysisService } from './services/station-analysis.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [AiService, GeminiService, StationAnalysisService],
  controllers: [AiController],
  exports: [GeminiService, StationAnalysisService],
})
export class AiModule {}
