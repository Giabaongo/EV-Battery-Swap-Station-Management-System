import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { TrendingUp, Clock, Flame } from 'lucide-react';

export default function SwapAnalytics({ data }) {
  const swapAnalytics = data.swapAnalytics;

  if (!swapAnalytics) {
    return null;
  }

  const frequency = swapAnalytics.frequency || {};
  const peakHours = swapAnalytics.peakHours || {};

  const frequencyData = [
    { period: 'Today', count: frequency.today || 0 },
    { period: 'This Week', count: frequency.this_week || 0 },
    { period: 'This Month', count: frequency.this_month || 0 },
  ];

  const hourlyData = peakHours.hourly_distribution || [];
  const peakHoursList = peakHours.peak_hours || [];

  return (
    <Card className="mb-8 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Swap Activity Analysis
        </h3>
      </div>

      {/* Frequency Overview */}
      <div className="grid grid-cols-3 md:grid-cols-4 border-b border-gray-200 dark:border-gray-800">
        <div className="p-5 text-center border-r border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {frequency.today || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
        </div>
        <div className="p-5 text-center md:border-r border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {frequency.this_week || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
        </div>
        <div className="p-5 text-center border-r border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-primary">{frequency.this_month || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
        </div>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-3 gap-4 p-5 border-b border-gray-200 dark:border-gray-800">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase font-semibold">
            Avg per Day
          </p>
          <p className="text-2xl font-bold text-primary">
            {frequency.averages?.per_day || 0}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase font-semibold">
            Avg per Week
          </p>
          <p className="text-2xl font-bold text-success">
            {frequency.averages?.per_week || 0}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase font-semibold">
            Avg per Month
          </p>
          <p className="text-2xl font-bold text-warning">
            {frequency.averages?.per_month || 0}
          </p>
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="p-5">
        <div className="mb-6">

        </div>

        {/* Hourly Distribution Chart */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Hourly Distribution (24 hours)
          </h4>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="hour"
                  stroke="#9ca3af"
                  tickFormatter={(value) => `${value}:00`}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value, name) => {
                    if (name === 'count') return [value, 'Swaps'];
                    return value;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  name="Number of Swaps"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hourly data available
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
