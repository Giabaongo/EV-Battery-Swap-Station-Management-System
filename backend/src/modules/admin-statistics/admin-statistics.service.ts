import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaymentStatus, TransferStatus } from '@prisma/client/wasm';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(private readonly databaseService: DatabaseService) { }

  async getBatteryTransferStats() {
    const [total, inProgress, completed, cancelled] = await Promise.all([
      this.databaseService.batteryTransferRequest.count(),
      this.databaseService.batteryTransferRequest.count({
        where: { status: TransferStatus.in_progress },
      }),
      this.databaseService.batteryTransferRequest.count({
        where: { status: TransferStatus.completed },
      }),
      this.databaseService.batteryTransferRequest.count({
        where: { status: TransferStatus.cancelled },
      }),
    ]);

    return {
      total,
      inProgress,
      completed,
      cancelled,
    };
  }

  async getRecentTransferRequests(limit = 10) {
    return await this.databaseService.batteryTransferRequest.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        fromStation: true,
        toStation: true,
      },
    });
  }

  async getStationStats() {
    // Add your station statistics logic
    const totalStations = await this.databaseService.station.count();

    return {
      totalStations,
      // Add more metrics as needed
    };
  }

  /**
   * Get revenue statistics by package
   */
  async getRevenueByPackage() {
    const packages = await this.databaseService.batteryServicePackage.findMany({
      where: { active: true },
      include: {
        subscriptions: {
          where: {
            status: 'active',
          },
        },
      },
    });

    return packages.map(pkg => ({
      package_id: pkg.package_id,
      package_name: pkg.name,
      total_subscriptions: pkg.subscriptions.length,
      total_revenue: pkg.subscriptions.length * Number(pkg.base_price),
      base_price: Number(pkg.base_price),
    }));
  }

  /**
   * Get current month revenue
   */
  async getCurrentMonthRevenue() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const payments = await this.databaseService.payment.findMany({
      where: {
        created_at: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: PaymentStatus.success
      },
    });

    const totalRevenue = payments.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0);

    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      total_revenue: totalRevenue,
      total_transactions: payments.length,
      average_transaction: payments.length > 0 ? totalRevenue / payments.length : 0,
    };
  }

  /**
   * Get top stations by swap count
   */
  async getTopStationsBySwaps(limit = 10) {
    const stations = await this.databaseService.station.findMany({
      include: {
        swap_transactions: {
          where: {
            status: 'completed',
          },
        },
      },
    });

    const stationsWithCount = stations.map(station => ({
      station_id: station.station_id,
      station_name: station.name,
      address: station.address,
      total_swaps: station.swap_transactions.length,
      status: station.status,
    }));

    return stationsWithCount
      .sort((a, b) => b.total_swaps - a.total_swaps)
      .slice(0, limit);
  }

  /**
   * Get top packages by subscription count
   */
  async getTopPackagesBySubscriptions(limit = 10) {
    const packages = await this.databaseService.batteryServicePackage.findMany({
      include: {
        subscriptions: true,
      },
    });

    const packagesWithCount = packages.map(pkg => ({
      package_id: pkg.package_id,
      package_name: pkg.name,
      base_price: Number(pkg.base_price),
      total_subscriptions: pkg.subscriptions.length,
      active_subscriptions: pkg.subscriptions.filter(sub => sub.status === 'active').length,
      revenue: pkg.subscriptions.length * Number(pkg.base_price),
    }));

    return packagesWithCount
      .sort((a, b) => b.total_subscriptions - a.total_subscriptions)
      .slice(0, limit);
  }

  /**
   * Get subscription cancellation stats for current month
   */
  async getCurrentMonthCancellations() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const cancelledSubscriptions = await this.databaseService.subscription.findMany({
      where: {
        status: 'cancelled',
        updated_at: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        package: {
          select: {
            package_id: true,
            name: true,
            base_price: true,
          },
        },
      },
    });

    const byPackage = cancelledSubscriptions.reduce((acc, sub) => {
      const packageId = sub.package?.package_id || 0;
      const packageName = sub.package?.name || 'Unknown';
      const basePrice = Number(sub.package?.base_price || 0);

      if (!acc[packageId]) {
        acc[packageId] = {
          package_id: packageId,
          package_name: packageName,
          base_price: basePrice,
          cancellation_count: 0
        };
      }

      acc[packageId].cancellation_count++;

      return acc;
    }, {} as Record<number, any>);

    // Sort by cancellation count descending
    const sortedByPackage = Object.values(byPackage)
      .sort((a: any, b: any) => b.cancellation_count - a.cancellation_count);


    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      total_cancellations: cancelledSubscriptions.length,
      by_package: sortedByPackage,
      top_cancelled_package: sortedByPackage[0] || null,
    };
  }

  /**
   * Get support/feedback statistics by station
   */
  async getSupportStatsByStation() {
    const supports = await this.databaseService.support.findMany({
      include: {
        station: {
          select: {
            station_id: true,
            name: true,
          },
        },
      },
    });

    const stationGroups = supports.reduce((acc, support) => {
      const stationKey = support.station_id || 'no_station';
      if (!acc[stationKey]) {
        acc[stationKey] = {
          station_id: support.station_id,
          station_name: support.station?.name || 'General Support',
          total_tickets: 0,
          by_status: {
            open: 0,
            in_progress: 0,
            closed: 0,
          },
          by_type: {
            battery_issue: 0,
            station_issue: 0,
            other: 0,
          },
          average_rating: 0,
          ratings_count: 0,
        };
      }

      acc[stationKey].total_tickets++;
      acc[stationKey].by_status[support.status]++;
      acc[stationKey].by_type[support.type]++;

      if (support.rating) {
        acc[stationKey].average_rating += support.rating;
        acc[stationKey].ratings_count++;
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate average ratings
    Object.keys(stationGroups).forEach(key => {
      const group = stationGroups[key];
      if (group.ratings_count > 0) {
        group.average_rating = group.average_rating / group.ratings_count;
      }
    });

    return Object.values(stationGroups).sort((a: any, b: any) => b.total_tickets - a.total_tickets);
  }

  /**
   * Get swap frequency statistics (daily, weekly, monthly)
   */
  async getSwapFrequencyStats() {
    const now = new Date();

    // Today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // This week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [todaySwaps, weekSwaps, monthSwaps, totalSwaps] = await Promise.all([
      this.databaseService.swapTransaction.count({
        where: {
          createAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
          status: 'completed',
        },
      }),
      this.databaseService.swapTransaction.count({
        where: {
          createAt: {
            gte: startOfWeek,
          },
          status: 'completed',
        },
      }),
      this.databaseService.swapTransaction.count({
        where: {
          createAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: 'completed',
        },
      }),
      this.databaseService.swapTransaction.count({
        where: {
          status: 'completed',
        },
      }),
    ]);

    // Calculate averages
    const daysInMonth = endOfMonth.getDate();
    const daysInWeek = 7;

    return {
      today: todaySwaps,
      this_week: weekSwaps,
      this_month: monthSwaps,
      total: totalSwaps,
      averages: {
        per_day: Math.round(monthSwaps / daysInMonth),
        per_week: Math.round(weekSwaps / daysInWeek),
        per_month: monthSwaps,
      },
    };
  }

  /**
   * Get peak hours for battery swaps
   */
  async getPeakHoursStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all completed swaps in current month
    const swaps = await this.databaseService.swapTransaction.findMany({
      where: {
        createAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'completed',
      },
      select: {
        createAt: true,
      },
    });

    // Group by hour (0-23)
    const hourlyStats = new Array(24).fill(0);

    swaps.forEach(swap => {
      const hour = swap.createAt.getHours();
      hourlyStats[hour]++;
    });

    // Find peak hours (top 5)
    const hourlyData = hourlyStats.map((count, hour) => ({
      hour,
      count,
      percentage: swaps.length > 0 ? ((count / swaps.length) * 100).toFixed(2) : '0.00',
    }));

    const peakHours = [...hourlyData]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Categorize time periods
    const morningSwaps = hourlyStats.slice(6, 12).reduce((a, b) => a + b, 0);
    const afternoonSwaps = hourlyStats.slice(12, 18).reduce((a, b) => a + b, 0);
    const eveningSwaps = hourlyStats.slice(18, 22).reduce((a, b) => a + b, 0);
    const nightSwaps = [...hourlyStats.slice(22, 24), ...hourlyStats.slice(0, 6)].reduce((a, b) => a + b, 0);

    return {
      peak_hours: peakHours,
      hourly_distribution: hourlyData,
      total_swaps: swaps.length,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }


  async getDashboardOverview() {
    this.logger.log('Fetching admin dashboard overview');

    const [
      transferStats,
      recentRequests,
      stationStats,
      revenueByPackage,
      currentMonthRevenue,
      topStations,
      topPackages,
      cancellations,
      supportStats,
      swapFrequency,
      peakHours,
    ] = await Promise.all([
      this.getBatteryTransferStats(),
      this.getRecentTransferRequests(5),
      this.getStationStats(),
      this.getRevenueByPackage(),
      this.getCurrentMonthRevenue(),
      this.getTopStationsBySwaps(10),
      this.getTopPackagesBySubscriptions(10),
      this.getCurrentMonthCancellations(),
      this.getSupportStatsByStation(),
      this.getSwapFrequencyStats(),
      this.getPeakHoursStats(),
    ]);

    return {
      transferStats,
      recentRequests,
      stationStats,
      revenue: {
        byPackage: revenueByPackage,
        currentMonth: currentMonthRevenue,
      },
      topStations,
      topPackages,
      cancellations,
      supportStats,
      swapAnalytics: {
        frequency: swapFrequency,
        peakHours: peakHours,
      },
      timestamp: new Date(),
    };
  }
}
