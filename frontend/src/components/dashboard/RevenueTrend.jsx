import React from 'react';
import { Card } from '../ui/card';
import { formatCurrency } from '../../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { ChartContainer } from '../ui/chart';

export default function RevenueTrend({ data }) {
  const currentMonth = data.revenue?.currentMonth;
  const lineData = data.revenue?.dailyTrend || [];

  // Chart config for shadcn
  const chartConfig = {
    revenue: {
      label: 'Revenue',
    },
  };

  return (
    <Card className="p-5">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Revenue Trend - {currentMonth?.month}/{currentMonth?.year}
      </h3>
      {lineData.length > 0 ? (
        <ChartContainer config={chartConfig} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                stroke="#9ca3af"
                label={{ value: 'Days in Month', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis
                stroke="#9ca3af"
                tickFormatter={(value) => `${value / 1000000}M`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No revenue trend data available
        </div>
      )}
    </Card>
  );
}
