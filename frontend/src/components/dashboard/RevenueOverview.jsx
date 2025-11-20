import React from 'react';
import { Card } from '../ui/card';
import { formatCurrency } from '../../utils/formatters';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp } from 'lucide-react';
import { ChartContainer } from '../ui/chart';

export default function RevenueOverview({ data }) {
  const byPackageData = data.revenue?.byPackage || [];
  const currentMonth = data.revenue?.currentMonth;
  const lineData = data.revenue?.dailyTrend || [];

  // Transform data for pie chart
  const pieData = byPackageData.map((pkg) => ({
    name: pkg.package_name,
    value: pkg.total_revenue,
  }));

  // Colors for pie chart
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Chart config for shadcn
  const chartConfig = {
    revenue: {
      label: 'Revenue',
    },
    ...byPackageData.reduce((acc, pkg, idx) => {
      acc[pkg.package_name] = {
        label: pkg.package_name,
        color: COLORS[idx % COLORS.length],
      };
      return acc;
    }, {}),
  };

  return (
    <Card className="p-5">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Package className="w-5 h-5" />
        Revenue Overview - {currentMonth?.month}/{currentMonth?.year}
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Revenue by Package - Pie Chart */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            By Package (This Month)
          </h4>
          {byPackageData.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  {/*Phần popup của cái biểu đồ tròn revenue */}
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '8px 12px',
                    }}
                    itemStyle={{
                      color: '#fff',
                    }}
                    labelStyle={{
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No revenue data available
            </div>
          )}
          {/* Legend for Pie Chart */}
          {byPackageData.length > 0 && (
            <div className="mt-4 space-y-2">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Trend - Line Chart */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trend - {currentMonth?.month}/{currentMonth?.year}
          </h4>
          {lineData.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="day"
                    stroke="#9ca3af"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    tickFormatter={(value) => `${value / 1000000}M`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '8px 12px',
                    }}
                    itemStyle={{
                      color: '#fff',
                    }}
                    labelStyle={{
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No revenue trend data available
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
