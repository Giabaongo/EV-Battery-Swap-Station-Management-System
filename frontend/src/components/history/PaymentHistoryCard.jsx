import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import FilterControls from './FilterControls';
import PaginationControls from './PaginationControls';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Eye } from 'lucide-react';

export default function PaymentHistoryCard({
  paymentHistory,
  loading,
  sortBy,
  sortOrder,
  onSort,
  // Filter props
  resultsPerPage,
  onResultsPerPageChange,
  timePeriod,
  onTimePeriodChange,
  // Pagination props
  currentPage,
  totalPages,
  totalResults,
  startIndex,
  endIndex,
  onPageChange,
  onPrevious,
  onNext
}) {
  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowUpDown size={16} className="text-gray-400" />;
    return sortOrder === 'asc' ? (
      <ArrowUpDown size={16} className="text-green-600" />
    ) : (
      <ArrowUpDown size={16} className="text-green-600" />
    );
  };

  const [selectedSwap, setSelectedSwap] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleViewDetail = (swap) => {
    setSelectedSwap(swap);
    setDetailOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <FilterControls
        title="Payment History"
        resultsPerPage={resultsPerPage}
        onResultsPerPageChange={onResultsPerPageChange}
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Date Column */}
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => onSort('date')}
                  className="flex items-center space-x-2 font-semibold text-gray-700 hover:text-green-600 transition-colors"
                >
                  <span>Date</span>
                  <SortIcon column="date" />
                </button>
              </th>

              {/* Package/Description Column */}
              <th className="px-6 py-4 text-left">
                <span className="font-semibold text-gray-700">Package</span>
              </th>

              {/* Amount Column */}
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => onSort('amount')}
                  className="flex items-center space-x-2 font-semibold text-gray-700 hover:text-green-600 transition-colors"
                >
                  <span>Price</span>
                  <SortIcon column="amount" />
                </button>
              </th>

              {/* Time Column */}
              <th className="px-6 py-4 text-left">
                <span className="font-semibold text-gray-700">Time</span>
              </th>

              {/* Detail Column */}
              <th className="px-6 py-4 text-center">
                <span className="font-semibold text-gray-700">Detail</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="ml-3 text-gray-600">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paymentHistory.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  No payment history found
                </td>
              </tr>
            ) : (
              paymentHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800">{item.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-800">{item.location}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {item.method?.toUpperCase()} • {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${item.status === 'success'
                      ? 'bg-blue-100 text-blue-800'
                      : item.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {item.amount.toLocaleString()} VND
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(item)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Detail</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={totalResults}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={onPageChange}
        onPrevious={onPrevious}
        onNext={onNext}
      />





    </div>
  );
}
