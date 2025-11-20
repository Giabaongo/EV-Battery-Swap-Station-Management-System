import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ReservationHistory({ reservations = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter reservations
    const filteredReservations = reservations.filter(reservation => {
        const matchesSearch = !searchTerm ||
            reservation.user_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.vehicle?.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' ||
            reservation.status?.toLowerCase() === statusFilter.toLowerCase();

        const matchesDate = !dateFilter ||
            new Date(reservation.created_at || reservation.scheduled_time).toISOString().split('T')[0] === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Pagination
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedReservations = filteredReservations.slice(startIndex, startIndex + itemsPerPage);

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase() || '';

        const statusConfig = {
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
            expired: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Expired' },
            scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled' },
            confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
        };

        const config = statusConfig[statusLower] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <section>
            <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                Station Reservation History
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search by VIN or User..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">Status: All</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="confirmed">Confirmed</option>
                        </select>
                        <input
                            className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                            type="date"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="text-xs uppercase bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-3" scope="col">User</th>
                                <th className="px-6 py-3" scope="col">Date &amp; Time</th>
                                <th className="px-6 py-3" scope="col">VIN</th>
                                <th className="px-6 py-3" scope="col">Battery</th>
                                <th className="px-6 py-3" scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedReservations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        No reservations found
                                    </td>
                                </tr>
                            ) : (
                                paginatedReservations.map((reservation) => {
                                    const batteryInfo = reservation.battery
                                        ? `#${reservation.battery.battery_id}${reservation.battery.slot_number ? ` - Slot ${reservation.battery.slot_number}` : ''}`
                                        : reservation.battery_id
                                            ? `#${reservation.battery_id}`
                                            : 'N/A';

                                    return (
                                        <tr
                                            key={reservation.reservation_id}
                                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                {reservation.user?.username || reservation.user?.name || `User #${reservation.user_id}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatDateTime(reservation.scheduled_time || reservation.created_at)}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {reservation.vehicle?.vin || `VIN${reservation.vehicle_id}`}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {batteryInfo}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(reservation.status)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredReservations.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-3 text-sm text-gray-600">
                        <span>
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredReservations.length)} of {filteredReservations.length} results
                        </span>
                        <div className="inline-flex items-center -space-x-px">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 ml-0 leading-tight border border-gray-200 rounded-l-lg hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>

                            {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = idx + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = idx + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + idx;
                                } else {
                                    pageNum = currentPage - 2 + idx;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-2 leading-tight border border-gray-200 hover:bg-gray-50 hover:text-gray-900 ${currentPage === pageNum ? 'bg-blue-50 text-blue-700' : ''
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 leading-tight border border-gray-200 rounded-r-lg hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

