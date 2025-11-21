import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../../utils/formatters';
import { Medal, TrendingUp } from 'lucide-react';

const RANK_BADGES = {
  0: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-300' },
  1: { bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
  2: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300' },
};

export default function TopPerformers({ data }) {
  const topStations = data.topStations || [];
  const topPackages = data.topPackages || [];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-2 gap-6 mb-8">
      {/* Top 10 Stations by Swaps */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Top Stations by Swaps
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">Rank</th>
                <th className="px-6 py-3 text-left">Station</th>
                <th className="px-6 py-3 text-right">Total Swaps</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              {topStations.slice(0, 5).map((station, index) => {
                const rankBadge = RANK_BADGES[index];
                return (
                  <tr
                    key={station.station_id}
                    className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-3">
                      <Badge className={`${rankBadge?.bg || 'bg-gray-100 dark:bg-gray-800'} ${rankBadge?.text || 'text-gray-700 dark:text-gray-300'}`}>
                        #{index + 1}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                      {station.station_name}
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                        {station.address}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">
                      {station.total_swaps.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {topStations.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No station data available.
          </div>
        )}
      </Card>

      {/* Top Packages by Subscriptions */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-warning" />
            Top Packages by Subscriptions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">Package</th>
                <th className="px-6 py-3 text-right">Subscriptions</th>
                <th className="px-6 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              {topPackages.slice(0, 5).map((pkg, index) => {
                const rankBadge = RANK_BADGES[index];
                return (
                  <tr
                    key={pkg.package_id}
                    className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${rankBadge?.bg || 'bg-gray-100 dark:bg-gray-800'} ${rankBadge?.text || 'text-gray-700 dark:text-gray-300'}`}>
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {pkg.package_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Base: {formatCurrency(pkg.base_price)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {pkg.total_subscriptions}
                        </p>
                        <p className="text-xs text-success">
                          User using: {pkg.active_subscriptions}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">
                      {formatCurrency(pkg.revenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {topPackages.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No package data available.
          </div>
        )}
      </Card>
    </div>
  );
}
