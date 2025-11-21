import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { swapService } from '../../services/swapService';
import { stationService } from '../../services/stationService';
import { vehicleService } from '../../services/vehicleService';
import { reservationService } from '../../services/reservationService';
import SwapHistoryCard from '../../components/history/SwapHistoryCard';
import PaymentHistoryCard from '../../components/history/PaymentHistoryCard';
import ReservationHistoryCard from '../../components/history/ReservationHistoryCard';

export default function SwapHistory() {
  // Get user from parent (Driver.jsx) via Outlet context
  const { user } = useOutletContext();

  // Pagination state for swaps
  const [swapCurrentPage, setSwapCurrentPage] = useState(1);
  const [swapResultsPerPage, setSwapResultsPerPage] = useState(10);
  const [swapTotalResults, setSwapTotalResults] = useState(0);

  // Pagination state for payments
  const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);
  const [paymentResultsPerPage, setPaymentResultsPerPage] = useState(10);
  const [paymentTotalResults, setPaymentTotalResults] = useState(0);

  // Pagination state for reservations
  const [reservationCurrentPage, setReservationCurrentPage] = useState(1);
  const [reservationResultsPerPage, setReservationResultsPerPage] = useState(10);
  const [reservationTotalResults, setReservationTotalResults] = useState(0);

  // Sorting state
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'amount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // Filter state for swaps
  const [swapTimePeriod, setSwapTimePeriod] = useState('week'); // 'week', 'month', 'year'

  // Filter state for payments
  const [paymentTimePeriod, setPaymentTimePeriod] = useState('week'); // 'week', 'month', 'year'

  // Filter state for reservations
  const [reservationTimePeriod, setReservationTimePeriod] = useState('week'); // 'week', 'month', 'year'

  // Data state
  const [swapHistory, setSwapHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [reservationHistory, setReservationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState({});

  // Filter data by time period
  const filterByTimePeriod = (data, timePeriod) => {
    const now = new Date();
    const filtered = data.filter(item => {
      const itemDate = new Date(item.date);

      if (timePeriod === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= oneWeekAgo;
      } else if (timePeriod === 'month') {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return itemDate >= oneMonthAgo;
      } else if (timePeriod === 'year') {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return itemDate >= oneYearAgo;
      }
      return true;
    });

    return filtered;
  };

  // Fetch data
  useEffect(() => {
    const fetchSwapHistory = async () => {
      if (!user?.user_id) {
        console.warn('No user ID found');
        setSwapHistory([]);
        setPaymentHistory([]);
        setReservationHistory([]);
        setSwapTotalResults(0);
        setPaymentTotalResults(0);
        setReservationTotalResults(0);
        return;
      }

      setLoading(true);
      try {
        // Fetch stations, swap transactions, payments, vehicles, and reservations in parallel
        const [allStations, swapTransactions, payments, vehicles, reservations] = await Promise.all([
          stationService.getAllStations(),
          swapService.getAllSwapTransactionsByUserId(user.user_id),
          paymentService.getPaymentByUserId(user.user_id),
          vehicleService.getVehicleByUserId(user.user_id),
          reservationService.getReservationsByUserId(user.user_id)
        ]);

        console.log('Swap transactions from API:', swapTransactions);
        console.log('Payments from API:', payments);
        console.log('Stations from API:', allStations);
        console.log('Vehicles from API:', vehicles);
        console.log('Reservations from API:', reservations);

        // Create a map of station_id to station object for quick lookup
        const stationMap = {};
        if (allStations && Array.isArray(allStations)) {
          allStations.forEach(station => {
            stationMap[station.station_id] = station;
          });
        }
        setStations(stationMap);

        // Create a map of vehicle_id to vehicle object for quick lookup
        const vehicleMap = {};
        if (vehicles && Array.isArray(vehicles)) {
          vehicles.forEach(vehicle => {
            vehicleMap[vehicle.vehicle_id] = vehicle;
          });
        }

        // Transform swap transactions to UI format
        const transformedSwaps = (swapTransactions || []).map(transaction => {
          const station = stationMap[transaction.station_id];
          const vehicle = vehicleMap[transaction.vehicle_id];
          return {
            id: `swap-${transaction.transaction_id}`,
            type: 'swap',
            date: transaction.createAt
              ? new Date(transaction.createAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
              : 'N/A',
            time: transaction.createAt
              ? new Date(transaction.createAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
              : 'N/A',
            location: station?.name || station?.address || `Station ${transaction.station_id || 'Unknown'}`,
            vin: vehicle?.vin || 'N/A',
            amount: 1, // Each transaction is 1 battery swap
            timestamp: transaction.createAt ? new Date(transaction.createAt).getTime() : 0,
            status: transaction.status,
            batteryTaken: transaction.battery_taken_id,
            batteryReturned: transaction.battery_returned_id,
            rawData: transaction
          };
        });

        // Transform payments to UI format
        const transformedPayments = (payments || []).map(payment => ({
          id: `payment-${payment.payment_id}`,
          type: 'payment',
          date: payment.created_at
            ? new Date(payment.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
            : 'N/A',
          time: payment.created_at
            ? new Date(payment.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
            : 'N/A',
          location: payment.package?.name || payment.order_info || 'Payment',
          amount: parseFloat(payment.amount || 0),
          timestamp: payment.created_at ? new Date(payment.created_at).getTime() : 0,
          status: payment.status,
          method: payment.method,
          packageName: payment.package?.name,
          rawData: payment
        }));

        // Transform reservations to UI format
        const transformedReservations = (reservations || []).map(reservation => {
          const station = stationMap[reservation.station_id];
          const vehicle = vehicleMap[reservation.vehicle_id];
          const dateField = reservation.created_at || reservation.scheduled_time;
          return {
            id: `reservation-${reservation.reservation_id}`,
            type: 'reservation',
            date: dateField
              ? new Date(dateField).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
              : 'N/A',
            time: dateField
              ? new Date(dateField).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
              : 'N/A',
            location: station?.name || station?.address || `Station ${reservation.station_id || 'Unknown'}`,
            vin: vehicle?.vin || 'N/A',
            status: reservation.status,
            timestamp: dateField ? new Date(dateField).getTime() : 0,
            rawData: reservation
          };
        });

        // Apply time period filter to all
        const filteredSwaps = filterByTimePeriod(transformedSwaps, swapTimePeriod);
        const filteredPayments = filterByTimePeriod(transformedPayments, paymentTimePeriod);
        const filteredReservations = filterByTimePeriod(transformedReservations, reservationTimePeriod);

        // Apply sorting to swaps
        const sortedSwaps = [...filteredSwaps].sort((a, b) => {
          if (sortBy === 'date') {
            const comparison = a.timestamp - b.timestamp;
            return sortOrder === 'asc' ? comparison : -comparison;
          } else if (sortBy === 'amount') {
            return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
          }
          return 0;
        });

        // Apply sorting to payments
        const sortedPayments = [...filteredPayments].sort((a, b) => {
          if (sortBy === 'date') {
            const comparison = a.timestamp - b.timestamp;
            return sortOrder === 'asc' ? comparison : -comparison;
          } else if (sortBy === 'amount') {
            return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
          }
          return 0;
        });

        // Apply sorting to reservations
        const sortedReservations = [...filteredReservations].sort((a, b) => {
          if (sortBy === 'date') {
            const comparison = a.timestamp - b.timestamp;
            return sortOrder === 'asc' ? comparison : -comparison;
          }
          return 0;
        });

        // Update total results
        setSwapTotalResults(sortedSwaps.length);
        setPaymentTotalResults(sortedPayments.length);
        setReservationTotalResults(sortedReservations.length);

        // Apply pagination to swaps
        const swapStartIndex = (swapCurrentPage - 1) * swapResultsPerPage;
        const swapEndIndex = swapStartIndex + swapResultsPerPage;
        const paginatedSwaps = sortedSwaps.slice(swapStartIndex, swapEndIndex);

        // Apply pagination to payments
        const paymentStartIndex = (paymentCurrentPage - 1) * paymentResultsPerPage;
        const paymentEndIndex = paymentStartIndex + paymentResultsPerPage;
        const paginatedPayments = sortedPayments.slice(paymentStartIndex, paymentEndIndex);

        // Apply pagination to reservations
        const reservationStartIndex = (reservationCurrentPage - 1) * reservationResultsPerPage;
        const reservationEndIndex = reservationStartIndex + reservationResultsPerPage;
        const paginatedReservations = sortedReservations.slice(reservationStartIndex, reservationEndIndex);

        setSwapHistory(paginatedSwaps);
        setPaymentHistory(paginatedPayments);
        setReservationHistory(paginatedReservations);
      } catch (error) {
        console.error('Error fetching history:', error);
        setSwapHistory([]);
        setPaymentHistory([]);
        setReservationHistory([]);
        setSwapTotalResults(0);
        setPaymentTotalResults(0);
        setReservationTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSwapHistory();
  }, [swapCurrentPage, swapResultsPerPage, paymentCurrentPage, paymentResultsPerPage, reservationCurrentPage, reservationResultsPerPage, sortBy, sortOrder, swapTimePeriod, paymentTimePeriod, reservationTimePeriod, user?.user_id]);

  // Calculate pagination info for swaps
  const swapTotalPages = Math.ceil(swapTotalResults / swapResultsPerPage);
  const swapStartIndex = (swapCurrentPage - 1) * swapResultsPerPage + 1;
  const swapEndIndex = Math.min(swapCurrentPage * swapResultsPerPage, swapTotalResults);

  // Calculate pagination info for payments
  const paymentTotalPages = Math.ceil(paymentTotalResults / paymentResultsPerPage);
  const paymentStartIndex = (paymentCurrentPage - 1) * paymentResultsPerPage + 1;
  const paymentEndIndex = Math.min(paymentCurrentPage * paymentResultsPerPage, paymentTotalResults);

  // Calculate pagination info for reservations
  const reservationTotalPages = Math.ceil(reservationTotalResults / reservationResultsPerPage);
  const reservationStartIndex = (reservationCurrentPage - 1) * reservationResultsPerPage + 1;
  const reservationEndIndex = Math.min(reservationCurrentPage * reservationResultsPerPage, reservationTotalResults);

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setSwapCurrentPage(1); // Reset to first page when sorting
    setPaymentCurrentPage(1);
    setReservationCurrentPage(1);
  };

  // Handler functions for Swap History
  const handleSwapResultsPerPageChange = (value) => {
    setSwapResultsPerPage(value);
    setSwapCurrentPage(1);
  };

  const handleSwapTimePeriodChange = (period) => {
    setSwapTimePeriod(period);
    setSwapCurrentPage(1);
  };

  const handleSwapPageChange = (pageNum) => {
    setSwapCurrentPage(pageNum);
  };

  const handleSwapPrevious = () => {
    setSwapCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleSwapNext = () => {
    setSwapCurrentPage(prev => Math.min(swapTotalPages, prev + 1));
  };

  // Handler functions for Payment History
  const handlePaymentResultsPerPageChange = (value) => {
    setPaymentResultsPerPage(value);
    setPaymentCurrentPage(1);
  };

  const handlePaymentTimePeriodChange = (period) => {
    setPaymentTimePeriod(period);
    setPaymentCurrentPage(1);
  };

  const handlePaymentPageChange = (pageNum) => {
    setPaymentCurrentPage(pageNum);
  };

  const handlePaymentPrevious = () => {
    setPaymentCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handlePaymentNext = () => {
    setPaymentCurrentPage(prev => Math.min(paymentTotalPages, prev + 1));
  };

  // Handler functions for Reservation History
  const handleReservationResultsPerPageChange = (value) => {
    setReservationResultsPerPage(value);
    setReservationCurrentPage(1);
  };

  const handleReservationTimePeriodChange = (period) => {
    setReservationTimePeriod(period);
    setReservationCurrentPage(1);
  };

  const handleReservationPageChange = (pageNum) => {
    setReservationCurrentPage(pageNum);
  };

  const handleReservationPrevious = () => {
    setReservationCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleReservationNext = () => {
    setReservationCurrentPage(prev => Math.min(reservationTotalPages, prev + 1));
  };

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto">
        <SwapHistoryCard
          swapHistory={swapHistory}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          resultsPerPage={swapResultsPerPage}
          onResultsPerPageChange={handleSwapResultsPerPageChange}
          timePeriod={swapTimePeriod}
          onTimePeriodChange={handleSwapTimePeriodChange}
          currentPage={swapCurrentPage}
          totalPages={swapTotalPages}
          totalResults={swapTotalResults}
          startIndex={swapStartIndex}
          endIndex={swapEndIndex}
          onPageChange={handleSwapPageChange}
          onPrevious={handleSwapPrevious}
          onNext={handleSwapNext}
        />

        <PaymentHistoryCard
          paymentHistory={paymentHistory}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          resultsPerPage={paymentResultsPerPage}
          onResultsPerPageChange={handlePaymentResultsPerPageChange}
          timePeriod={paymentTimePeriod}
          onTimePeriodChange={handlePaymentTimePeriodChange}
          currentPage={paymentCurrentPage}
          totalPages={paymentTotalPages}
          totalResults={paymentTotalResults}
          startIndex={paymentStartIndex}
          endIndex={paymentEndIndex}
          onPageChange={handlePaymentPageChange}
          onPrevious={handlePaymentPrevious}
          onNext={handlePaymentNext}
        />

        <ReservationHistoryCard
          reservationHistory={reservationHistory}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          resultsPerPage={reservationResultsPerPage}
          onResultsPerPageChange={handleReservationResultsPerPageChange}
          timePeriod={reservationTimePeriod}
          onTimePeriodChange={handleReservationTimePeriodChange}
          currentPage={reservationCurrentPage}
          totalPages={reservationTotalPages}
          totalResults={reservationTotalResults}
          startIndex={reservationStartIndex}
          endIndex={reservationEndIndex}
          onPageChange={handleReservationPageChange}
          onPrevious={handleReservationPrevious}
          onNext={handleReservationNext}
        />
      </div>
    </div>
  );
}
