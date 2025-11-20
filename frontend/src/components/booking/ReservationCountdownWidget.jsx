import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, X, Clock, MapPin, Battery } from 'lucide-react';
import { toast } from 'sonner';
import { useReservation, useAuth } from '../../hooks/useContext';
import io from 'socket.io-client';

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

    const socketRef = useRef(null);
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

    // Setup WebSocket listener (run once, regardless of activeReservation)
    useEffect(() => {
        const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080';
        const socket = io(`${wsUrl}/reservations`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            query: {
                token: localStorage.getItem('token'),
            },
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log(`✅ WebSocket connected: ${socket.id}`);
        });

        // Listen for ALL reservation updates
        socket.on('reservation.updated', (data) => {
            console.log('📢 Reservation updated:', data);

            // Check if this update is for the current active reservation
            if (activeReservation?.reservation_id === data.reservationId) {
                setReservationStatus(data.status);

                if (data.status === 'completed') {
                    console.log('✨ Reservation completed!');
                    toast.success('🎉 Pin đã được đổi thành công!');
                    // Stop countdown
                    if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current);
                    }
                    localStorage.removeItem('countdownTimeRemaining');
                    // Hide widget after 3 seconds
                    setTimeout(() => {
                        clearActiveReservation();
                    }, 3000);
                } else if (data.status === 'cancelled') {
                    console.log('❌ Reservation cancelled!');
                    toast.info('Lịch đặt đã bị hủy');
                    if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current);
                    }
                    localStorage.removeItem('countdownTimeRemaining');
                    setTimeout(() => {
                        clearActiveReservation();
                    }, 2000);
                }
            }
        });

        socket.on('disconnect', (reason) => {
            console.warn(`🔌 WebSocket disconnected: ${reason}`);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.off('reservation.updated');
                socketRef.current.disconnect();
            }
        };
    }, [activeReservation?.reservation_id, clearActiveReservation]);

    // Polling fallback (3s) - only if activeReservation exists
    useEffect(() => {
        if (!activeReservation?.reservation_id || !user?.user_id) {
            console.log('⏭️ Polling skipped - missing reservation or user');
            return;
        }

        console.log('🔍 Polling setup - activeReservation:', {
            reservation_id: activeReservation.reservation_id,
            status: activeReservation.status,
            user_id: user.user_id,
        });

        // Initialize last status
        if (!lastStatusRef.current) {
            lastStatusRef.current = activeReservation.status;
            setReservationStatus(activeReservation.status);
            console.log('📍 Initial status set:', activeReservation.status);
        }

        const checkReservationStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.warn('⚠️ No token, skipping polling');
                    return;
                }

                console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Polling check...`);
                console.log(`   User ID: ${user.user_id}, Reservation ID: ${activeReservation.reservation_id}`);

                // Try direct endpoint first (use /reservations NOT /api/reservations since base URL already has /api/v1)
                let response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/reservations/user/${user.user_id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                console.log('📡 Response status:', response.status);
                console.log('📡 Response headers:', {
                    contentType: response.headers.get('content-type'),
                });

                if (!response.ok) {
                    console.warn(`⚠️ Endpoint failed with status ${response.status}, trying swap-transactions endpoint...`);

                    // Try alternative: get swap transactions instead
                    response = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/swap-transactions/user/${user.user_id}`,
                        {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    console.log('📡 Swap-transactions response status:', response.status);

                    if (!response.ok) {
                        console.warn(`⚠️ Both endpoints failed`);
                        return;
                    }

                    // For swap-transactions, check if there's a recent completed one for this reservation
                    const swaps = await response.json();
                    console.log('📦 Swap transactions fetched:', swaps.length);

                    // If there's a completed swap for this reservation ID, mark as completed
                    // This is a workaround since reservation ID might be in the swap record
                    const recentSwap = swaps[0];
                    if (recentSwap && recentSwap.status === 'completed') {
                        console.log('✅ Found completed swap transaction!');
                        const currentStatus = 'completed';

                        if (currentStatus !== lastStatusRef.current) {
                            console.log(`\n✨✨✨ STATUS CHANGED! ${lastStatusRef.current} → ${currentStatus} ✨✨✨\n`);
                            lastStatusRef.current = currentStatus;
                            setReservationStatus(currentStatus);

                            console.log('🎉 COMPLETED DETECTED! Executing completion logic...');
                            if (countdownIntervalRef.current) {
                                clearInterval(countdownIntervalRef.current);
                                countdownIntervalRef.current = null;
                                console.log('  ✅ Countdown stopped');
                            }
                            if (pollIntervalRef.current) {
                                clearInterval(pollIntervalRef.current);
                                pollIntervalRef.current = null;
                                console.log('  ✅ Polling stopped');
                            }

                            toast.success('Your reservation has been completed!', { duration: 3000 });
                            setTimeout(() => {
                                console.log('🗑️ NOW Clearing active reservation...');
                                localStorage.removeItem('countdownTimeRemaining');
                                clearActiveReservation();
                            }, 3000);
                        }
                    }
                    return;
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    console.warn('⚠️ Response is not JSON:', contentType);
                    return;
                }

                const reservations = await response.json();
                console.log('📦 All reservations fetched:', reservations.length, 'items');
                console.log('   Reservations:', reservations.map(r => ({ id: r.reservation_id, status: r.status })));

                const foundReservation = reservations.find(r => r.reservation_id === activeReservation.reservation_id);

                if (!foundReservation) {
                    console.warn(`❌ Reservation ${activeReservation.reservation_id} not found in list!`);
                    console.log('   Available IDs:', reservations.map(r => r.reservation_id));
                    return;
                }

                const currentStatus = foundReservation.status;
                console.log(`📊 Found reservation [${foundReservation.reservation_id}] status:`, {
                    lastStatus: lastStatusRef.current,
                    currentStatus: currentStatus,
                    changed: currentStatus !== lastStatusRef.current,
                });

                // Only trigger if status actually changed
                if (currentStatus !== lastStatusRef.current) {
                    console.log(`\n✨✨✨ STATUS CHANGED! ${lastStatusRef.current} → ${currentStatus} ✨✨✨\n`);

                    lastStatusRef.current = currentStatus;
                    setReservationStatus(currentStatus);

                    if (currentStatus === 'completed') {
                        console.log('🎉 COMPLETED DETECTED! Executing completion logic...');
                        console.log('  - Stopping countdown timer...');

                        if (countdownIntervalRef.current) {
                            clearInterval(countdownIntervalRef.current);
                            countdownIntervalRef.current = null;
                            console.log('  ✅ Countdown stopped');
                        }

                        console.log('  - Stopping polling...');
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                            console.log('  ✅ Polling stopped');
                        }

                        console.log('  - Showing toast...');
                        toast.success('Your reservation has been completed!', { duration: 3000 });

                        console.log('  - Scheduling widget clear in 3s...');
                        setTimeout(() => {
                            console.log('🗑️ NOW Clearing active reservation...');
                            localStorage.removeItem('countdownTimeRemaining');
                            clearActiveReservation();
                        }, 3000);

                    } else if (currentStatus === 'cancelled') {
                        console.log('❌ CANCELLED DETECTED! Executing cancellation logic...');
                        console.log('  - Stopping countdown timer...');

                        if (countdownIntervalRef.current) {
                            clearInterval(countdownIntervalRef.current);
                            countdownIntervalRef.current = null;
                            console.log('  ✅ Countdown stopped');
                        }

                        console.log('  - Stopping polling...');
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                            console.log('  ✅ Polling stopped');
                        }

                        console.log('  - Showing toast...');
                        toast.info('Your reservation has been cancelled.', { duration: 2000 });

                        console.log('  - Scheduling widget clear in 2s...');
                        setTimeout(() => {
                            console.log('🗑️ NOW Clearing active reservation...');
                            localStorage.removeItem('countdownTimeRemaining');
                            clearActiveReservation();
                        }, 2000);
                    }
                } else {
                    console.log('⏸️ Status unchanged, no action needed');
                }
            } catch (error) {
                console.error('❌ Polling error:', error.message);
                console.error('   Stack:', error.stack);
            }
        };

        console.log('🚀 Starting polling check...');
        // Run immediately
        checkReservationStatus();

        // Then poll every 3 seconds
        pollIntervalRef.current = setInterval(checkReservationStatus, 3000);
        console.log('📌 Polling interval started (every 3s)');

        return () => {
            console.log('🛑 Cleaning up polling useEffect');
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeReservation?.reservation_id, user?.user_id, clearActiveReservation]);

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
            await updateReservationStatus(
                activeReservation.reservation_id,
                user.user_id,
                'cancelled'
            );
            toast.success('Reservation cancelled successfully.');
            localStorage.removeItem('countdownTimeRemaining');
            clearActiveReservation();
        } catch (error) {
            console.error('Error cancelling:', error);
            toast.error('Error: Unable to cancel reservation');
        } finally {
            setIsCancelling(false);
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
