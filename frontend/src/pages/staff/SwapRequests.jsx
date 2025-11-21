import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth, useSubscription, useSwapRequest } from '../../hooks/useContext';
import { useReservationWebSocket } from '../../hooks/useReservationWebSocket';
import { vehicleService } from '../../services/vehicleService';
import { batteryService } from '../../services/batteryService';
import { reservationService } from '../../services/reservationService';
import userService from '../../services/userService';
import PendingSwapRequestCard from '../../components/swap/PendingSwapRequestCard';
import ReservationHistory from '../../components/swap/ReservationHistory';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function StaffSwapRequests() {
    const { getSubscriptionsByUserId } = useSubscription();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Use useSwapRequest hook to get swap requests data
    const {
        swapRequests,
        loading,
        error,
        fetchSwapRequestsForStation
    } = useSwapRequest();

    // Local state for all reservations (for history) and enriched pending requests
    const [allReservations, setAllReservations] = useState([]);
    const [enrichedRequests, setEnrichedRequests] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Pagination for pending requests
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3; // 1 row x 3 columns

    // Memoize WebSocket callback to prevent reconnect loop
    const handleReservationCreated = useCallback((data) => {
        // When new reservation created, refresh the list
        if (user?.station_id && data.stationId === user.station_id) {
            console.log('📢 New reservation detected via WebSocket, refreshing data...');
            // Fetch latest data without loading state (background update)
            fetchSwapRequestsForStation(user.station_id, false);
            // Also refresh history
            fetchAllReservations(false);
        }
    }, [user?.station_id, fetchSwapRequestsForStation]);

    // Setup WebSocket listener for real-time reservation updates
    useReservationWebSocket(handleReservationCreated, !!user?.station_id);

    // Fetch scheduled reservations when component mounts or user changes
    useEffect(() => {
        if (user?.station_id) {
            // Initial load with loading state
            fetchSwapRequestsForStation(user.station_id, true);
        }
    }, [user?.station_id, fetchSwapRequestsForStation]);

    // Fetch all reservations for history (not just scheduled)
    const fetchAllReservations = async (isInitialLoad = false) => {
        if (!user?.station_id) return;

        // Only show loading on initial load
        if (isInitialLoad) {
            setHistoryLoading(true);
        }
        try {
            // Get reservations for this station (currently returns scheduled only from backend)
            // But we pass them to ReservationHistory which will show them with all status options
            const allRes = await reservationService.getReservationsByStationId(user.station_id);

            // Enrich with user, vehicle, and battery info
            const enrichedAll = await Promise.all(
                (Array.isArray(allRes) ? allRes : []).map(async (reservation) => {
                    try {
                        const [userInfo, vehicle, battery] = await Promise.all([
                            userService.getUserById(reservation.user_id).catch(() => null),
                            vehicleService.getVehicleById(reservation.vehicle_id).catch(() => null),
                            reservation.battery_id
                                ? batteryService.getBatteryById(reservation.battery_id).catch(() => null)
                                : Promise.resolve(null)
                        ]);

                        return {
                            ...reservation,
                            user: userInfo,
                            vehicle: vehicle,
                            battery: battery
                        };
                    } catch (err) {
                        console.error(`Error enriching reservation ${reservation.reservation_id}:`, err);
                        return reservation;
                    }
                })
            );

            setAllReservations(enrichedAll);
        } catch (err) {
            console.error('Error fetching all reservations:', err);
        } finally {
            if (isInitialLoad) {
                setHistoryLoading(false);
            }
        }
    };

    // Load history on mount
    useEffect(() => {
        if (user?.station_id) {
            // Initial load with loading state
            fetchAllReservations(true);
        }
    }, [user?.station_id]);

    // Enrich swap requests with user, vehicle, and battery info
    useEffect(() => {
        const enrichRequests = async () => {
            if (!swapRequests || swapRequests.length === 0) {
                setEnrichedRequests([]);
                return;
            }

            try {
                const enrichedData = await Promise.all(
                    swapRequests.map(async (reservation) => {
                        try {
                            // Fetch user, vehicle, and battery info in parallel
                            const [userInfo, vehicle, battery] = await Promise.all([
                                userService.getUserById(reservation.user_id).catch(() => null),
                                vehicleService.getVehicleById(reservation.vehicle_id).catch(() => null),
                                reservation.battery_id
                                    ? batteryService.getBatteryById(reservation.battery_id).catch(() => null)
                                    : Promise.resolve(null)
                            ]);

                            return {
                                ...reservation,
                                user: userInfo,
                                vehicle: vehicle,
                                battery: battery
                            };
                        } catch (err) {
                            console.error(`Error enriching reservation ${reservation.reservation_id}:`, err);
                            return reservation;
                        }
                    })
                );

                setEnrichedRequests(enrichedData);
            } catch (err) {
                console.error('Error enriching requests:', err);
                setEnrichedRequests(swapRequests);
            }
        };

        enrichRequests();
    }, [swapRequests]);

    const handleProcessRequest = async (reservation) => {
        try {
            console.log('Processing reservation:', reservation);

            // Fetch vehicle info to get VIN and current battery
            const vehicle = await vehicleService.getVehicleById(reservation.vehicle_id);
            console.log('Vehicle info:', vehicle);

            // Fetch active subscription for this user
            const subscription = await getSubscriptionsByUserId(reservation.user_id);
            console.log('Subscription info:', subscription);

            // Navigate to manual swap transaction form with all data
            const params = new URLSearchParams({
                reservationId: reservation.reservation_id,
                userId: reservation.user_id,
                vehicleId: reservation.vehicle_id,
                vin: vehicle.vin || 'N/A',
                stationId: reservation.station_id,
                batteryReturnedId: vehicle.battery_id || '',
                subscriptionId: subscription?.subscription_id || '',
                subscriptionName: subscription?.package?.package_name || 'No active subscription',
                // Prefill batteryId from reservation
                batteryId: reservation.battery_id || '',
            });

            console.log('URL Params being sent:', params.toString());
            // Navigate and set navigation state so ManualSwapTransaction can open modal only
            // when navigation originates from 'Process Swap'. This avoids opening on reload.
            navigate(`/staff/manual-swap?${params.toString()}`, { state: { openSwapModal: true } });
        } catch (error) {
            console.error('Error processing request:', error);
            toast.error('Failed to process request: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[40vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading swap requests...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[40vh]">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
                    <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Pending Swap Requests Section */}
            <section>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex min-w-72 flex-col gap-2">
                        <h1 className="text-gray-900 text-3xl font-black leading-tight tracking-[-0.033em]">
                            Pending Swap Requests
                        </h1>
                        <p className="text-gray-600 text-base font-normal leading-normal">
                            Review and process incoming battery swap requests.
                        </p>
                    </div>
                    {/* Navigation Arrows - Only show if there are multiple pages */}
                    {enrichedRequests.length > itemsPerPage && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(enrichedRequests.length / itemsPerPage), prev + 1))}
                                disabled={currentPage >= Math.ceil(enrichedRequests.length / itemsPerPage)}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {enrichedRequests.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        {/* <div className="text-gray-300 text-6xl mb-4"></div> */}
                        <p className="text-gray-500 text-lg font-medium">No pending swap requests</p>
                        <p className="text-gray-400 text-sm mt-2">Confirmed bookings will appear here</p>
                    </div>
                ) : (
                    <>
                        {/* Grid */}
                        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrichedRequests
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((reservation) => (
                                    <PendingSwapRequestCard
                                        key={reservation.reservation_id}
                                        reservation={reservation}
                                        onProcessSwap={handleProcessRequest}
                                    />
                                ))}
                        </div>
                    </>
                )}
            </section>

            {/* Reservation History Section */}
            {historyLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading history...</p>
                </div>
            ) : (
                <ReservationHistory reservations={allReservations} />
            )}
        </main>
    );
}

