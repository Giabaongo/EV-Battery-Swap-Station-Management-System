import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import FilterControls from './FilterControls';
import PaginationControls from './PaginationControls';

export default function ReservationHistoryCard({
    reservationHistory = [],
    loading,
    sortBy,
    sortOrder,
    onSort,
    resultsPerPage,
    onResultsPerPageChange,
    timePeriod,
    onTimePeriodChange,
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
            <ArrowUpDown size={16} className="text-blue-600" />
        ) : (
            <ArrowUpDown size={16} className="text-blue-600" />
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
            <FilterControls
                title="Reservation History"
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
                                    className="flex items-center space-x-2 font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    <span>Date</span>
                                    <SortIcon column="date" />
                                </button>
                            </th>

                            {/* Time Column */}
                            <th className="px-6 py-4 text-left">
                                <span className="font-semibold text-gray-700">Time</span>
                            </th>

                            {/* Station Column */}
                            <th className="px-6 py-4 text-left">
                                <span className="font-semibold text-gray-700">Station</span>
                            </th>

                            {/* Vehicle Column */}
                            <th className="px-6 py-4 text-left">
                                <span className="font-semibold text-gray-700">Vehicle</span>
                            </th>

                            {/* Status Column */}
                            <th className="px-6 py-4 text-left">
                                <span className="font-semibold text-gray-700">Status</span>
                            </th>

                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-3 text-gray-600">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : reservationHistory.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    No reservation history found
                                </td>
                            </tr>
                        ) : (
                            reservationHistory.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-800">{item.date}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.time}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.location}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.vin}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${item.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : item.status === 'scheduled'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item.status}
                                        </span>
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
