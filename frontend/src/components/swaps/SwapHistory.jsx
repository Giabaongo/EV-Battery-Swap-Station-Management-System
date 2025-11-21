
// import SwapRequest from "./SwapRequest";

import { useNavigate } from 'react-router-dom';

export default function SwapHistory({
  type = "swap",
  recentTransactions = [],
  loading = false
}) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/50',
        text: 'text-green-800 dark:text-green-400',
        dot: 'bg-green-500',
        label: 'Completed'
      },
      'in-progress': {
        bg: 'bg-yellow-100 dark:bg-yellow-900/50',
        text: 'text-yellow-800 dark:text-yellow-400',
        dot: 'bg-yellow-500',
        label: 'In Progress'
      },
      pending: {
        bg: 'bg-blue-100 dark:bg-blue-900/50',
        text: 'text-blue-800 dark:text-blue-400',
        dot: 'bg-blue-500',
        label: 'Pending'
      }
    };

    const config = statusMap[status] || statusMap.completed;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`size-2 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const RecentTransactions = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center px-6 pt-5 pb-3">
        <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
          Recent Battery Swap Transactions
        </h2>
        <button
          onClick={() => navigate('/staff/swap-history')}
          className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <span>View All</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
            <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
          </svg>
        </button>
      </div>
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">User ID</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">Vehicle ID</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">Timestamp</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">Battery Returned ID</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">Battery Taken ID</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.transaction_id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="h-[60px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                      {transaction.transaction_id}
                    </td>
                    <td className="h-[60px] px-4 py-2 text-gray-800 dark:text-gray-200 text-sm font-normal leading-normal">
                      {transaction.user_id}
                    </td>
                    <td className="h-[60px] px-4 py-2 text-gray-800 dark:text-gray-200 text-sm font-normal leading-normal">
                      {transaction.vehicle_id}
                    </td>
                    <td className="h-[60px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                      {formatTimestamp(transaction.createAt || transaction.created_at || transaction.swap_date)}
                    </td>
                    <td className="h-[60px] px-4 py-2 text-gray-800 dark:text-gray-200 text-sm font-normal leading-normal">
                      {transaction.battery_returned_id}
                    </td>
                    <td className="h-[60px] px-4 py-2 text-gray-800 dark:text-gray-200 text-sm font-normal leading-normal">
                      {transaction.battery_taken_id}
                    </td>
                    <td className="h-[60px] px-4 py-2 text-sm font-normal leading-normal">
                      {getStatusBadge(transaction.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (type === "swap") return <RecentTransactions />;
  return null;
}
