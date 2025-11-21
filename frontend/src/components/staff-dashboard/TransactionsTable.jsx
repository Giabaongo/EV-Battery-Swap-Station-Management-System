import { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { swapService } from '../../services/swapService';
import { useAuth } from '../../hooks/useContext';

export default function TransactionsTable() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (user) {
            fetchRecentTransactions();
        }
    }, [user]);

    useEffect(() => {
        applyFilters();
        setCurrentPage(1); // Reset to first page when filters change
    }, [transactions, searchQuery, selectedStatus, selectedDate]);

    const fetchRecentTransactions = async () => {
        try {
            setLoading(true);

            let response;
            if (user?.station_id) {
                response = await swapService.getAllSwapTransactionsByStationId(user.station_id);
            } else {
                response = await swapService.getAllSwapTransactions();
            }

            const allTransactions = response.data || response;

            // Sort by timestamp descending (newest first) - get ALL transactions
            const sortedTransactions = [...allTransactions].sort((a, b) => {
                const dateA = new Date(a.swap_time || a.createAt);
                const dateB = new Date(b.swap_time || b.createAt);
                return dateB - dateA;
            });

            setTransactions(sortedTransactions);
            setFilteredTransactions(sortedTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...transactions];

        // Search by user name or transaction ID
        if (searchQuery) {
            filtered = filtered.filter(t => {
                const userName = (t.user?.full_name || t.user?.username || '').toLowerCase();
                const transactionId = String(t.transaction_id || '').toLowerCase();
                return userName.includes(searchQuery.toLowerCase()) ||
                    transactionId.includes(searchQuery.toLowerCase());
            });
        }

        // Filter by status
        if (selectedStatus && selectedStatus !== 'all') {
            filtered = filtered.filter(t =>
                t.status?.toLowerCase() === selectedStatus.toLowerCase()
            );
        }

        // Filter by date
        if (selectedDate) {
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.swap_time || t.createAt);
                const filterDate = new Date(selectedDate);
                return transactionDate.toDateString() === filterDate.toDateString();
            });
        }

        setFilteredTransactions(filtered);
    };
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('all');
        setSelectedDate('');
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery || selectedStatus !== 'all' || selectedDate;

    // Pagination calculations
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: {
                bg: 'bg-green-100 dark:bg-green-900/50',
                text: 'text-green-800 dark:text-green-400',
                dot: 'bg-green-500',
                label: 'Completed'
            },
            pending: {
                bg: 'bg-yellow-100 dark:bg-yellow-900/50',
                text: 'text-yellow-800 dark:text-yellow-400',
                dot: 'bg-yellow-500',
                label: 'In Progress'
            },
            failed: {
                bg: 'bg-red-100 dark:bg-red-900/50',
                text: 'text-red-800 dark:text-red-400',
                dot: 'bg-red-500',
                label: 'Failed'
            }
        };

        const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
                <span className={`size-2 rounded-full ${config.dot}`}></span>
                {config.label}
            </span>
        );
    };

    const formatTimestamp = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return 'Invalid date';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4 px-6 pt-5 pb-3">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                        Battery Swap Transactions
                    </h2>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${showFilters
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </button>
                </div>

                {/* Search Bar - Always visible */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by user name or transaction ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                {/* Filters Section - Collapsible */}
                {showFilters && (
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        {/* Status Filter */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="completed">Completed</option>
                                <option value="pending">In Progress</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                <span className="text-sm font-medium">Clear</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Results count */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    {filteredTransactions.length !== transactions.length && ` (filtered from ${transactions.length} total)`}
                </div>
            </div>

            <div className="px-4 py-3">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {hasActiveFilters ? 'No transactions match your filters' : 'No transactions found'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">
                                        Transaction ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">
                                        Timestamp
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">
                                        Battery Taken
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">
                                        Battery Returned
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentTransactions.map((transaction) => (
                                    <tr key={transaction.transaction_id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="h-[60px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                                            #{transaction.transaction_id || 'N/A'}
                                        </td>
                                        <td className="h-[60px] px-4 py-2 text-gray-800 dark:text-gray-200 text-sm font-normal leading-normal">
                                            {transaction.user?.full_name || transaction.user?.username || 'Unknown User'}
                                        </td>
                                        <td className="h-[60px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                                            {formatTimestamp(transaction.swap_time || transaction.createAt)}
                                        </td>
                                        <td className="h-[60px] px-4 py-2 text-gray-800 dark:text-gray-200 text-sm font-normal leading-normal">
                                            {transaction.battery_taken_id || 'N/A'}
                                        </td>
                                        <td className="h-[60px] px-4 py-2 text-gray-800 dark:text-gray-200 text-sm font-normal leading-normal">
                                            {transaction.battery_returned_id || 'N/A'}
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

            {/* Pagination */}
            {!loading && filteredTransactions.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentPage === 1
                                    ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, index) => {
                                const page = index + 1;
                                // Show first, last, current, and adjacent pages
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                    ? 'bg-primary text-white'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return (
                                        <span key={page} className="text-gray-400 dark:text-gray-500">
                                            ...
                                        </span>
                                    );
                                }
                                return null;
                            })}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentPage === totalPages
                                    ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}