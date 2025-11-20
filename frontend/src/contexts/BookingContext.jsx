
import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { reservationService } from "../services/reservationService";

const {
    getReservationsByStationId: getReservationsByStationIdService,
    createReservation: createReservationService,
    getReservationById: getReservationByIdService,
    updateReservationStatus: updateReservationStatusService,
    getReservationsByUserId: getReservationsByUserIdService
} = reservationService;

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
    // ============ RESERVATION STATE (from ReservationContext) ============
    const [reservations, setReservations] = useState([]);
    const [activeReservation, setActiveReservation] = useState(null);
    const [reservationLoading, setReservationLoading] = useState(false);
    const [reservationError, setReservationError] = useState(null);

    // ============ SWAP REQUEST STATE (from SwapRequestContext) ============
    const [swapRequests, setSwapRequests] = useState([]);
    const [swapRequestLoading, setSwapRequestLoading] = useState(false);
    const [swapRequestError, setSwapRequestError] = useState(null);

    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('swapNotifications');
        return saved ? JSON.parse(saved) : [];
    });

    // ============ RESERVATION METHODS ============
    const createReservation = useCallback(async (reservationData) => {
        setReservationLoading(true);
        setReservationError(null);
        try {
            const created = await createReservationService(reservationData);
            const reservationEntity = created?.reservation_id ? created : (created?.reservation ?? created);
            setReservations((prev) => [...prev, reservationEntity]);
            setActiveReservation(reservationEntity);
            // Persist to localStorage
            localStorage.setItem('activeReservation', JSON.stringify(reservationEntity));
            return reservationEntity;
        } catch (err) {
            console.error('createReservation error', err);
            setReservationError("Failed to create reservation");
            throw err;
        } finally {
            setReservationLoading(false);
        }
    }, []);

    const getAllReservationsByStationId = useCallback(async (stationId) => {
        setReservationLoading(true);
        setReservationError(null);
        try {
            const allReservations = await getReservationsByStationIdService(stationId);
            setReservations(allReservations);
            return allReservations;
        } catch (err) {
            console.error('fetchAllReservations error', err);
            setReservationError("Failed to fetch reservations");
            throw err;
        } finally {
            setReservationLoading(false);
        }
    }, []);

    const getReservationById = useCallback(async (id) => {
        setReservationLoading(true);
        setReservationError(null);
        try {
            const reservation = await getReservationByIdService(id);
            return reservation;
        } catch (err) {
            console.error('getReservationById error', err);
            setReservationError("Failed to fetch reservation");
            throw err;
        } finally {
            setReservationLoading(false);
        }
    }, []);

    const getReservationsByUserId = useCallback(async (userId, options = {}) => {
        const { signal } = options;
        setReservationLoading(true);
        setReservationError(null);
        try {
            const userReservations = await getReservationsByUserIdService(userId, { signal });
            setReservations(userReservations);

            const activeRes = userReservations.find(r => r.status === 'scheduled');
            if (activeRes) setActiveReservation(activeRes);
            return userReservations;
        } catch (err) {
            const isCanceled = err?.name === 'CanceledError' || err?.message === 'canceled' || err?.code === 'ERR_CANCELED';
            if (isCanceled) return;
            console.error('getReservationsByUserId error', err);
            setReservationError("Failed to fetch user reservations");
            throw err;
        } finally {
            setReservationLoading(false);
        }
    }, []);

    const updateReservationStatus = useCallback(async (reservationId, userId, status) => {
        setReservationLoading(true);
        setReservationError(null);
        try {
            const updated = await updateReservationStatusService(reservationId, userId, status);
            setReservations(prev =>
                prev.map(r => r.reservation_id === reservationId ? updated : r)
            );
            setSwapRequests(prev =>
                prev.map(r => r.reservation_id === reservationId ? updated : r)
            );
            if (activeReservation?.reservation_id === reservationId) {
                if (status === 'completed' || status === 'cancelled') {
                    setActiveReservation(null);
                    // Clear from localStorage when cancelled or completed
                    localStorage.removeItem('activeReservation');
                } else {
                    setActiveReservation(updated);
                    // Update localStorage with new status
                    localStorage.setItem('activeReservation', JSON.stringify(updated));
                }
            }
            return updated;
        } catch (err) {
            console.error('updateReservationStatus error', err);
            setReservationError("Failed to update reservation status");
            throw err;
        } finally {
            setReservationLoading(false);
        }
    }, [activeReservation]);

    const clearActiveReservation = useCallback(() => {
        setActiveReservation(null);
        // Remove from localStorage
        localStorage.removeItem('activeReservation');
    }, []);

    // ============ SWAP REQUEST METHODS ============
    const fetchSwapRequestsForStation = useCallback(async (stationId, isInitialLoad = true) => {
        if (!stationId) {
            console.warn('No station_id provided to fetch swap requests');
            return;
        }

        // Only show loading on initial load
        if (isInitialLoad) {
            setSwapRequestLoading(true);
        }
        setSwapRequestError(null);

        try {
            const allReservations = await reservationService.getReservationsByStationId(stationId);
            const scheduledReservations = allReservations.filter(res => res.status === 'scheduled');
            setSwapRequests(scheduledReservations);
        } catch (err) {
            console.error('Error fetching swap requests:', err);
            setSwapRequestError(err.message || 'Failed to fetch swap requests');
            setSwapRequests([]);
        } finally {
            if (isInitialLoad) {
                setSwapRequestLoading(false);
            }
        }
    }, []);

    const getPendingRequestsForStaff = useCallback((stationId) => {
        return swapRequests.filter(req => req.station_id === stationId && req.status === 'scheduled');
    }, [swapRequests]);

    const updateRequestStatus = useCallback(async (reservationId, userId, status) => {
        try {
            const updatedReservation = await reservationService.updateReservationStatus(reservationId, userId, status);

            setSwapRequests(prev =>
                prev.map(req => req.reservation_id === reservationId ? { ...req, status } : req)
            );

            return updatedReservation;
        } catch (err) {
            console.error('Error updating reservation status:', err);
            throw err;
        }
    }, []);

    // ============ NOTIFICATION METHODS ============
    const addNotification = useCallback((userId, message, type = 'info') => {
        const newNotification = {
            notification_id: Date.now(),
            user_id: userId,
            message,
            type,
            created_at: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    const getNotificationsForUser = useCallback((userId) => {
        return notifications.filter(notif => notif.user_id === userId);
    }, [notifications]);

    const markAsRead = useCallback((notificationId) => {
        setNotifications(prev =>
            prev.map(notif => notif.notification_id === notificationId ? { ...notif, read: true } : notif)
        );
    }, []);

    // ============ EFFECTS ============
    // Initialize activeReservation from localStorage
    // Only restore if status is 'scheduled' or 'pending', not 'cancelled' or 'completed'
    useEffect(() => {
        const saved = localStorage.getItem('activeReservation');
        if (saved) {
            try {
                const reservation = JSON.parse(saved);
                // Only restore if it's still active (scheduled or pending), not cancelled/completed
                if (reservation.status === 'scheduled' || reservation.status === 'pending') {
                    setActiveReservation(reservation);
                    console.log('✅ Restored activeReservation from localStorage:', reservation.reservation_id, 'status:', reservation.status);
                } else {
                    // Don't restore cancelled/completed reservations
                    console.log('⚠️ Skipped restoring cancelled/completed reservation:', reservation.reservation_id, 'status:', reservation.status);
                    localStorage.removeItem('activeReservation');
                }
            } catch (err) {
                console.error('Failed to parse activeReservation from localStorage:', err);
                localStorage.removeItem('activeReservation');
            }
        }
    }, []);

    // Save notifications to localStorage
    useEffect(() => {
        localStorage.setItem('swapNotifications', JSON.stringify(notifications));
    }, [notifications]);

    // Combined loading/error for backward compatibility
    const loading = reservationLoading || swapRequestLoading;
    const error = reservationError || swapRequestError;

    // Stable context value to avoid re-renders
    const contextValue = useMemo(() => ({
        // Reservation data & methods
        reservations,
        activeReservation,
        createReservation,
        getAllReservationsByStationId,
        getReservationById,
        getReservationsByUserId,
        updateReservationStatus,
        clearActiveReservation,

        // Swap request data & methods
        swapRequests,
        fetchSwapRequestsForStation,
        getPendingRequestsForStaff,
        updateRequestStatus,

        // Notification methods
        notifications,
        addNotification,
        getNotificationsForUser,
        markAsRead,

        // Combined status
        loading,
        error,

        // Individual status (for advanced use)
        reservationLoading,
        reservationError,
        swapRequestLoading,
        swapRequestError,
    }), [
        reservations,
        activeReservation,
        createReservation,
        getAllReservationsByStationId,
        getReservationById,
        getReservationsByUserId,
        updateReservationStatus,
        clearActiveReservation,
        swapRequests,
        fetchSwapRequestsForStation,
        getPendingRequestsForStaff,
        updateRequestStatus,
        notifications,
        addNotification,
        getNotificationsForUser,
        markAsRead,
        loading,
        error,
        reservationLoading,
        reservationError,
        swapRequestLoading,
        swapRequestError,
    ]);

    return (
        <BookingContext.Provider value={contextValue}>
            {children}
        </BookingContext.Provider>
    );
};
