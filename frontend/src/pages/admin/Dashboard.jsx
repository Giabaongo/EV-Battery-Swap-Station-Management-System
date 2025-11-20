import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { statisticService } from '../../services/statisticService';
import MetricCards from '../../components/dashboard/MetricCards';
import RevenueOverview from '../../components/dashboard/RevenueOverview';
import PackageAnalytics from '../../components/dashboard/PackageAnalytics';
import TopPerformers from '../../components/dashboard/TopPerformers';
import SwapAnalytics from '../../components/dashboard/SwapAnalytics';
import {
  RefreshCw,
  Calendar,
  ChevronDown,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticService.getAllStatistics();
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1 flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Real-time system overview as of {formatTime(lastUpdated)}
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center flex-wrap">
            <Button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              <span className="text-sm font-medium">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-8 border-danger/50 bg-danger/5 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
              <p className="text-sm text-danger">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchDashboard}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {dashboardData && (
          <>
            {/* Key Metrics Cards */}
            <MetricCards data={dashboardData} />

            {/* Analytics Section - 2 Column Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue Overview - Combined Revenue by Package & Trend */}
              <RevenueOverview data={dashboardData} />

              {/* Package Analytics - Combined Top Packages & Cancellations */}
              <PackageAnalytics data={dashboardData} />
            </div>

            {/* Top Stations by Swaps */}
            <TopPerformers data={dashboardData} />

            {/* Swap Analytics - Full Width */}
            <SwapAnalytics data={dashboardData} />

          </>
        )}
      </main>
    </div>
  );
}
