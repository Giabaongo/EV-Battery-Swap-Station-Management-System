import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { MessageSquare, Star, AlertCircle, Zap, Building2, FileText } from 'lucide-react';

const statusConfig = {
  open: { badge: 'bg-primary/10 text-primary', label: 'Open' },
  in_progress: { badge: 'bg-warning/10 text-warning', label: 'In Progress' },
  closed: { badge: 'bg-success/10 text-success', label: 'Closed' },
};

const typeConfig = {
  battery_issue: { badge: 'bg-danger/10 text-danger', label: 'Battery' },
  station_issue: { badge: 'bg-warning/10 text-warning', label: 'Station' },
  other: { badge: 'bg-primary/10 text-primary', label: 'Other' },
};

export default function SupportStats({ data }) {
  const supportStats = data.supportStats || [];

  if (supportStats.length === 0) {
    return (
      <Card className="mb-8 p-8 text-center text-gray-500 dark:text-gray-400">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No support data available.
      </Card>
    );
  }

  return (
    <Card className="mb-8 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Support System Overview
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">Station</th>
              <th className="px-6 py-3 text-right">Total Tickets</th>
              <th className="px-6 py-3 text-left">Status Breakdown</th>
              <th className="px-6 py-3 text-left">Issue Types</th>
              <th className="px-6 py-3 text-right">Avg Rating</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 dark:text-gray-300">
            {supportStats.map((stat) => (
              <tr
                key={stat.station_id}
                className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {/* Station Name */}
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {stat.station_name}
                  </p>
                </td>

                {/* Total Tickets */}
                <td className="px-6 py-4 text-right font-semibold">
                  {stat.total_tickets}
                </td>

                {/* Status Breakdown */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {stat.by_status.open > 0 && (
                      <Badge
                        className={statusConfig.open.badge}
                        title="Open tickets"
                      >
                        Open: {stat.by_status.open}
                      </Badge>
                    )}
                    {stat.by_status.in_progress > 0 && (
                      <Badge
                        className={statusConfig.in_progress.badge}
                        title="In Progress tickets"
                      >
                        Progress: {stat.by_status.in_progress}
                      </Badge>
                    )}
                    {stat.by_status.closed > 0 && (
                      <Badge
                        className={statusConfig.closed.badge}
                        title="Closed tickets"
                      >
                        Closed: {stat.by_status.closed}
                      </Badge>
                    )}
                  </div>
                </td>

                {/* Issue Types */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {stat.by_type.battery_issue > 0 && (
                      <Badge className={typeConfig.battery_issue.badge}>
                        <Zap className="w-3 h-3 inline mr-1" />
                        {typeConfig.battery_issue.label}: {stat.by_type.battery_issue}
                      </Badge>
                    )}
                    {stat.by_type.station_issue > 0 && (
                      <Badge className={typeConfig.station_issue.badge}>
                        <Building2 className="w-3 h-3 inline mr-1" />
                        {typeConfig.station_issue.label}: {stat.by_type.station_issue}
                      </Badge>
                    )}
                    {stat.by_type.other > 0 && (
                      <Badge className={typeConfig.other.badge}>
                        <FileText className="w-3 h-3 inline mr-1" />
                        {typeConfig.other.label}: {stat.by_type.other}
                      </Badge>
                    )}
                  </div>
                </td>

                {/* Average Rating */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {stat.average_rating > 0 ? (
                      <>
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {stat.average_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({stat.ratings_count})
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        No ratings
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Support Summary
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {supportStats.reduce((sum, s) => sum + s.total_tickets, 0)} total tickets across{' '}
              {supportStats.length} stations. Focus on stations with high issue counts and low
              ratings.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
