import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../../utils/formatters';
import { Medal, AlertTriangle } from 'lucide-react';

const RANK_BADGES = {
  0: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-300' },
  1: { bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
  2: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300' },
};

export default function PackageAnalytics({ data }) {
  const topPackages = data.topPackages || [];
  const cancellations = data.cancellations;

  const chartData = cancellations?.by_package || [];

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Medal className="w-5 h-5" />
          Package Analytics
        </h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 p-5">
        {/* Top Packages by Subscriptions */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Medal className="w-4 h-4 text-warning" />
            Top Packages by Subscriptions (All Time)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-right">Subs</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-300">
                {topPackages.slice(0, 3).map((pkg, index) => {
                  const rankBadge = RANK_BADGES[index];
                  return (
                    <tr
                      key={pkg.package_id}
                      className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge className={`${rankBadge?.bg || 'bg-gray-100 dark:bg-gray-800'} ${rankBadge?.text || 'text-gray-700 dark:text-gray-300'}`}>
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {pkg.package_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(pkg.base_price)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {pkg.total_subscriptions}
                          </p>
                          <p className="text-xs text-success">
                            Active: {pkg.active_subscriptions}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(pkg.revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {topPackages.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No package data available.
            </div>
          )}
        </div>

        {/* Cancellation Analysis */}
        {cancellations && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" />
                Cancellations - {cancellations.month}/{cancellations.year}
              </h4>
              <Badge className="bg-danger/10 text-danger font-semibold">
                {cancellations.total_cancellations}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Count</th>
                    <th className="px-4 py-3 text-right">%</th>
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
                        <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                          {pkg.package_name}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-400">
                          {formatCurrency(pkg.base_price)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-danger">
                          {pkg.cancellation_count}
                        </td>
                        <td className="px-4 py-4 text-right">
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
          </div>
        )}
      </div>
    </Card>
  );
}
