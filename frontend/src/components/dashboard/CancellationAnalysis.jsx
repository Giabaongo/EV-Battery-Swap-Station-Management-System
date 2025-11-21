import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';

export default function CancellationAnalysis({ data }) {
  const cancellations = data.cancellations;

  if (!cancellations) {
    return null;
  }

  const chartData = cancellations.by_package || [];

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-danger" />
          Subscription Cancellations - {cancellations.month}/{cancellations.year}
        </h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 p-5 border-b border-gray-200 dark:border-gray-800">
        {/* Total Cancellations */}
        <div className="bg-danger/5 rounded-lg p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
            Total Cancellations:
          </p>
          <p className="text-3xl font-bold text-danger">
            {cancellations.total_cancellations}
          </p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">Package Name</th>
              <th className="px-6 py-3 text-right">Base Price</th>
              <th className="px-6 py-3 text-right">Cancellation Count</th>
              <th className="px-6 py-3 text-right">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((pkg) => {
              const percentage =
                cancellations.total_cancellations > 0
                  ? ((pkg.cancellation_count / cancellations.total_cancellations) * 100).toFixed(1)
                  : 0;
              return (
                <tr
                  key={pkg.package_id}
                  className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {pkg.package_name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(pkg.base_price)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-danger">
                    {pkg.cancellation_count}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge
                      className={`${
                        percentage > 50 ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {percentage}%
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
