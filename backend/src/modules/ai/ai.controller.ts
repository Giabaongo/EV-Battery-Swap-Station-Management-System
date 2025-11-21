import {
  Controller,
  Get,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { $Enums } from '@prisma/client';
import {
  StationAnalysisService,
  AnalysisResult,
} from './services/station-analysis.service';

@Controller('ai')
@UseGuards(AuthGuard, RolesGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly stationAnalysisService: StationAnalysisService,
  ) {}

  /**
   * Analyze stations for upgrade recommendations using Gemini AI
   * Only accessible by admin
   */
  @Get('analyze-station-upgrades')
  @Roles($Enums.Role.admin)
  async analyzeStationUpgrades(): Promise<AnalysisResult> {
    try {
      this.logger.log('Received request to analyze station upgrades');
      const result =
        await this.stationAnalysisService.analyzeStationsForUpgrade();
      this.logger.log('Successfully returned analysis result');
      return result;
    } catch (error) {
      this.logger.error('Error in analyzeStationUpgrades:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to analyze stations',
          error: error.message || 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
