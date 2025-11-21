import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDate } from '../../utils/formatters';
import { ChevronDown, MapPin, Zap } from 'lucide-react';

const statusConfig = {
  completed: { badge: 'bg-success/10 text-success', label: 'Completed' },
  in_progress: { badge: 'bg-warning/10 text-warning', label: 'In Progress' },
  cancelled: { badge: 'bg-danger/10 text-danger', label: 'Cancelled' },
};

export default function BatteryTransferStats({ data }) {
  const [expandedId, setExpandedId] = useState(null);

  const stats = data.transferStats;
  const requests = data.recentRequests || [];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card className="mb-8 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-warning" />
          Battery Transfer Requests
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 md:grid-cols-4 border-b border-gray-200 dark:border-gray-800">
        <div className="p-5 text-center border-r border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.total || 0}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
        </div>
        <div className="p-5 text-center md:border-r border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-warning">{stats?.inProgress || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
        </div>
        <div className="p-5 text-center border-r border-gray-200 dark:border-gray-800">
          <p className="text-2xl font-bold text-success">{stats?.completed || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
        </div>
        <div className="p-5 text-center">
          <p className="text-2xl font-bold text-danger">{stats?.cancelled || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cancelled</p>
        </div>
      </div>

      {/* Recent Transfers Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3">From Station</th>
              <th className="px-6 py-3">To Station</th>
              <th className="px-6 py-3">Battery Model</th>
              <th className="px-6 py-3">Qty</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created Date</th>
              <th className="px-6 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
              const config = statusConfig[request.status] || statusConfig.in_progress;
              const isExpanded = expandedId === request.transfer_request_id;

              return (
                <React.Fragment key={request.transfer_request_id}>
                  <tr className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {request.fromStation?.name}
                    </td>
                    <td className="px-6 py-4">{request.toStation?.name}</td>
                    <td className="px-6 py-4">{request.battery_model}</td>
                    <td className="px-6 py-4">{request.quantity}</td>
                    <td className="px-6 py-4">
                      <Badge className={config.badge}>{config.label}</Badge>
                    </td>
                    <td className="px-6 py-4">{formatDate(request.created_at)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleExpand(request.transfer_request_id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row - Station Details */}
                  {isExpanded && (
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td colSpan="7" className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* From Station */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              From Station
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Name:{' '}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {request.fromStation?.name}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Address:{' '}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {request.fromStation?.address}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Coordinates:{' '}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {request.fromStation?.latitude},{' '}
                                  {request.fromStation?.longitude}
                                </span>
                              </p>
                              <Badge className="bg-success/10 text-success w-fit">
                                {request.fromStation?.status}
                              </Badge>
                            </div>
                          </div>

                          {/* To Station */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              To Station
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Name:{' '}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {request.toStation?.name}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Address:{' '}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {request.toStation?.address}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Coordinates:{' '}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {request.toStation?.latitude},{' '}
                                  {request.toStation?.longitude}
                                </span>
                              </p>
                              <Badge className="bg-success/10 text-success w-fit">
                                {request.toStation?.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {requests.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No battery transfer requests found.
        </div>
      )}
    </Card>
  );
}
