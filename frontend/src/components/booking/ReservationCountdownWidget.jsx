import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, X, Clock, MapPin, Battery } from 'lucide-react';
import { toast } from 'sonner';
import { useReservation, useAuth } from '../../hooks/useContext';
import { useReservationWebSocket } from '../../hooks/useReservationWebSocket';

export default function ReservationCountdownWidget() {
    const { activeReservation, updateReservationStatus, clearActiveReservation } = useReservation();
    const { user } = useAuth();

    // Calculate initial timeRemaining from scheduled_time + 30min
    const calculateTimeRemaining = useCallback((scheduledTime) => {
        if (!scheduledTime) return 30 * 60; // fallback to 30 min
        const scheduledMs = new Date(scheduledTime).getTime();
        const deadlineMs = scheduledMs + (30 * 60 * 1000); // 30 min after scheduled_time
        const nowMs = Date.now();
        const remainingMs = deadlineMs - nowMs;
        return Math.max(0, Math.ceil(remainingMs / 1000)); // in seconds, at least 0
    }, []);

    // Initialize timeRemaining from activeReservation.scheduled_time or localStorage
    const [timeRemaining, setTimeRemaining] = useState(() => {
        if (activeReservation?.scheduled_time) {
            return calculateTimeRemaining(activeReservation.scheduled_time);
        }
        // Restore from localStorage if available
        const saved = localStorage.getItem('countdownTimeRemaining');
        if (saved) {
            const savedTime = parseInt(saved, 10);
            // If saved time is reasonably close (within 1 hour), use it; otherwise recalculate
            if (savedTime > 0 && savedTime <= 3600) {
                console.log(`⏱️ Restored timeRemaining from localStorage: ${saved}s`);
                return savedTime;
            }
        }
        return 30 * 60;
    });

    const [isMinimized, setIsMinimized] = useState(false);
    const [reservationStatus, setReservationStatus] = useState(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const countdownIntervalRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const lastStatusRef = useRef(null); // Track last known status

    // Format time HH:MM:SS
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Auto-cancel khi hết thời gian (define before useEffect)
    const handleAutoCancel = useCallback(async () => {
        if (!activeReservation || !user) return;

        try {
            await updateReservationStatus(
                activeReservation.reservation_id,
                user.user_id,
                'cancelled'
            );
            toast.info('Time is up! Your reservation has been cancelled.');
            localStorage.removeItem('countdownTimeRemaining');
        } catch (error) {
            console.error('Error auto-cancelling:', error);
        }
    }, [activeReservation, user, updateReservationStatus]);


    // Force clear widget when status becomes cancelled or completed
    useEffect(() => {
        if (reservationStatus === 'cancelled' || reservationStatus === 'completed') {
            console.log('🔴 Force clearing widget due to status:', reservationStatus);
            const clearTimer = setTimeout(() => {
                clearActiveReservation();
            }, 1500);
            return () => clearTimeout(clearTimer);
        }
    }, [reservationStatus, clearActiveReservation]);

    // Reset reservationStatus when activeReservation changes
    useEffect(() => {
        if (activeReservation) {
            console.log('📋 Reset effect - new activeReservation:', activeReservation.reservation_id);
            setReservationStatus(activeReservation.status);
            lastStatusRef.current = activeReservation.status;
            // CRITICAL: Reset cancelling state for new reservation so cancel button works
            setIsCancelling(false);
        } else {
            console.log('📋 Reset effect - activeReservation cleared, resetting all state');
            setReservationStatus(null);
            lastStatusRef.current = null;
            setIsCancelling(false);
        }
    }, [activeReservation?.reservation_id, activeReservation]);

    // Dùng hook WebSocket cho reservation status update
    useReservationWebSocket(
        null,
        (data) => {
            // Lắng nghe event reservation.status.updated
            if (!activeReservation) return;
            if (activeReservation.reservation_id !== data.reservationId) return;
            setReservationStatus(data.currentStatus);

            if (data.currentStatus === 'completed') {
                toast.success('Your reservation has been completed!');
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                }
                localStorage.removeItem('countdownTimeRemaining');
                setTimeout(() => {
                    clearActiveReservation();
                }, 3000);
            } else if (data.currentStatus === 'cancelled') {
                toast.info('Your reservation has been cancelled.');
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                }
                localStorage.removeItem('countdownTimeRemaining');
                // Clear immediately to avoid showing old cancelled widget
                clearActiveReservation();
            }
        },
        true
    );

    // Countdown timer (1 giây)
    useEffect(() => {
        if (!activeReservation || timeRemaining <= 0) {
            console.log('⏭️ Countdown skipped - no reservation or time ended');
            return;
        }

        console.log(`⏱️ Countdown started from ${formatTime(timeRemaining)}`);

        countdownIntervalRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                const newTime = prev - 1;

                // Save to localStorage every second for recovery on reload
                if (newTime > 0) {
                    localStorage.setItem('countdownTimeRemaining', String(newTime));
                }

                // Only log every 30s to avoid spam
                if (newTime % 30 === 0) {
                    console.log(`⏱️ Time remaining: ${formatTime(newTime)}`);
                }
                if (newTime <= 1) {
                    console.log('⏰ TIME UP! Triggering auto-cancel...');
                    handleAutoCancel();
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        return () => {
            console.log('🛑 Cleaning up countdown useEffect');
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, [activeReservation, timeRemaining, handleAutoCancel]);

    // Cancel manually
    const handleCancel = async () => {
        if (!activeReservation || !user || isCancelling) return;

        setShowCancelDialog(false);
        setIsCancelling(true);

        try {
            const userId = user.user_id || user.id;
            if (!userId) throw new Error('User ID missing');

            console.log('🔴 Cancelling reservation:', {
                reservationId: activeReservation.reservation_id,
                userId: userId,
            });

            // Clear intervals FIRST
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }

            // Call API
            await updateReservationStatus(
                activeReservation.reservation_id,
                userId,
                'cancelled'
            );

            console.log('✅ API success - status updated to cancelled');

            // Update local status immediately
            setReservationStatus('cancelled');
            lastStatusRef.current = 'cancelled';

            toast.success('Reservation cancelled successfully.');
            localStorage.removeItem('countdownTimeRemaining');

            // Clear context to remove widget
            setTimeout(() => {
                console.log('🗑️ Clearing activeReservation from context');
                clearActiveReservation();
            }, 300);

        } catch (error) {
            console.error('❌ Cancel error:', error?.message);
            const errorMsg = error?.response?.data?.message || error?.message || 'Unable to cancel reservation';
            toast.error('Error: ' + errorMsg);

            // CRITICAL: Always reset isCancelling on error so dialog can be retried
            console.log('🔧 Resetting isCancelling state for retry');
            setIsCancelling(false);

            // Force clear widget anyway (might be stale)
            setReservationStatus('cancelled');
            setTimeout(() => {
                clearActiveReservation();
            }, 1000);
        }
    };

    const handleClose = () => {
        localStorage.removeItem('countdownTimeRemaining');
        clearActiveReservation();
    };

    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    if (!activeReservation) {
        console.log('👻 Widget not rendering - no active reservation');
        return null;
    }

    // Don't render if status is cancelled or completed (widget should be cleared from context)
    if (reservationStatus === 'cancelled' || reservationStatus === 'completed') {
        console.log('👻 Widget not rendering - reservation', reservationStatus);
        return null;
    }

    console.log('🎨 Widget rendering with:', {
        reservation_id: activeReservation.reservation_id,
        status: reservationStatus,
        timeRemaining: formatTime(timeRemaining),
        isMinimized,
    });

    // Status-based styling
    const statusStyles = {
        pending: {
            bg: 'bg-gradient-to-br from-blue-600 to-blue-700',
            header: 'bg-blue-700/80',
            border: 'border-blue-500',
            accent: 'text-blue-300',
        },
        scheduled: {
            bg: 'bg-gradient-to-br from-blue-600 to-blue-700',
            header: 'bg-blue-700/80',
            border: 'border-blue-500',
            accent: 'text-blue-300',
        },
        completed: {
            bg: 'bg-gradient-to-br from-green-600 to-green-700',
            header: 'bg-green-700/80',
            border: 'border-green-500',
            accent: 'text-green-300',
        },
        cancelled: {
            bg: 'bg-gradient-to-br from-red-600 to-red-700',
            header: 'bg-red-700/80',
            border: 'border-red-500',
            accent: 'text-red-300',
        },
    };

    const style = statusStyles[reservationStatus] || statusStyles.scheduled;

    return (
        <>
            {/* Widget */}
            <div
                className={`fixed z-50 ${style.border} border-2 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300
          ${isMinimized ? 'w-80' : 'w-96'}`}
                style={{
                    right: '24px',
                    bottom: '24px',
                }}
            >
                {/* Header */}
                <div className={`${style.header} px-4 py-3 flex items-center justify-between backdrop-blur-sm`}>
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-white animate-pulse" />
                        <div>
                            <p className="text-white font-bold text-sm">Reservation Countdown</p>
                            <p className="text-white/70 text-xs">ID: {activeReservation.reservation_id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleMinimize}
                            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition"
                            title={isMinimized ? 'Expand' : 'Minimize'}
                        >
                            {isMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        <button
                            onClick={handleClose}
                            className="text-white hover:bg-red-500/50 rounded-lg p-1.5 transition"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {!isMinimized && (
                    <div className={`${style.bg} p-5 space-y-4 text-white`}>
                        {/* Countdown Display */}
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm text-center border border-white/20">
                            <p className="text-white/70 text-sm mb-1">Time Remaining</p>
                            <p className="text-5xl font-bold font-mono mb-1">
                                {formatTime(timeRemaining)}
                            </p>
                            <p className="text-white/60 text-xs">
                                You have 30 minutes to complete the battery swap process.
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/20">
                            <div
                                className="bg-white h-full transition-all duration-300"
                                style={{
                                    width: `${(timeRemaining / (30 * 60)) * 100}%`,
                                }}
                            />
                        </div>

                        {/* Status */}
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                            <p className="text-white/70 text-xs uppercase tracking-wider">
                                Status: <span className="font-bold text-white capitalize">{reservationStatus}</span>
                            </p>
                        </div>

                        {/* Station Info */}
                        <div className="space-y-2 bg-white/5 rounded-lg p-3 border border-white/20">
                            <div className="flex items-center gap-2 text-white/90">
                                <MapPin size={16} />
                                <span className="text-sm">
                                    Station #{activeReservation.station_id}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-white/90">
                                <Battery size={16} />
                                <span className="text-sm">
                                    {new Date(activeReservation.scheduled_time).toLocaleTimeString('vi-VN')}
                                </span>
                            </div>
                        </div>

                        {/* Cancel Button */}
                        <button
                            onClick={() => setShowCancelDialog(true)}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            <X size={18} />
                            Cancel Reservation
                        </button>
                    </div>
                )}

                {/* Minimized View */}
                {isMinimized && (
                    <div className={`${style.bg} px-4 py-3 flex items-center justify-between`}>
                        <p className="text-3xl font-bold font-mono text-white">
                            {formatTime(timeRemaining)}
                        </p>
                        <button
                            onClick={() => setShowCancelDialog(true)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Cancel Confirmation Dialog */}
            {showCancelDialog && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Cancellation</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            Are you sure you want to cancel this reservation? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCancelDialog(false)}
                                disabled={isCancelling}
                                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition disabled:opacity-60"
                            >
                                No, Keep It
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition disabled:opacity-60"
                            >
                                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
