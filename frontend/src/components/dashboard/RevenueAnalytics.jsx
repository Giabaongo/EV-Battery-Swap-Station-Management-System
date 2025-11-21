import React from 'react';
import { Card } from '../ui/card';
import { formatCurrency } from '../../utils/formatters';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Package } from 'lucide-react';
import { ChartContainer } from '../ui/chart';

export default function RevenueAnalytics({ data }) {
  const byPackageData = data.revenue?.byPackage || [];
  const currentMonth = data.revenue?.currentMonth;

  // Transform data for pie chart
  const pieData = byPackageData.map((pkg) => ({
    name: pkg.package_name,
    value: pkg.total_revenue,
  }));

  // Colors for pie chart
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Line chart data from API
  const lineData = data.revenue?.dailyTrend || [];

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
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        Revenue by Package
      </h3>
      {byPackageData.length > 0 ? (
        <ChartContainer config={chartConfig} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No revenue data available
          </div>
        )}
    </Card>
  );
}
