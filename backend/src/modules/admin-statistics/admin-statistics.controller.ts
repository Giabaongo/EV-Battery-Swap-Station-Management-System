import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from './admin-statistics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin/statistics')
export class AdminDashboardController {
  constructor(private readonly statisticsService: AdminDashboardService) { }

  @Get('dashboard')
  async getDashboardOverview() {
    return this.statisticsService.getDashboardOverview();
  }

  @Get('revenue/by-package')
  async getRevenueByPackage() {
    return this.statisticsService.getRevenueByPackage();
  }

  @Get('revenue/current-month')
  async getCurrentMonthRevenue() {
    return this.statisticsService.getCurrentMonthRevenue();
  }

  @Get('top-stations')
  async getTopStationsBySwaps(@Query('limit') limit?: string) {
    return this.statisticsService.getTopStationsBySwaps(limit ? parseInt(limit) : 10);
  }

  @Get('top-packages')
  async getTopPackagesBySubscriptions(@Query('limit') limit?: string) {
    return this.statisticsService.getTopPackagesBySubscriptions(limit ? parseInt(limit) : 10);
  }

  @Get('cancellations/current-month')
  async getCurrentMonthCancellations() {
    return this.statisticsService.getCurrentMonthCancellations();
  }

  @Get('support-stats')
  async getSupportStatsByStation() {
    return this.statisticsService.getSupportStatsByStation();
  }

  @Get('battery-transfers')
  async getBatteryTransferStats() {
    return this.statisticsService.getBatteryTransferStats();
  }

  @Get('stations')
  async getStationStats() {
    return this.statisticsService.getStationStats();
  }
}
