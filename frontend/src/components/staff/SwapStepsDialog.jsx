import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { swappingService } from '../../services/swappingService';
import { vehicleService } from '../../services/vehicleService';
import userService from '../../services/userService';
import { X, ChevronRight, AlertCircle } from 'lucide-react';

const SWAP_STEPS = {
    RETURN_BATTERY: 'return_battery',
    CHECK_BATTERY_HEALTH: 'check_battery_health',
    COLLECT_BATTERY: 'collect_battery',
    SWAP_SUCCESS: 'swap_success',
};

export default function SwapStepsDialog({
    open,
    onOpenChange,
    userId,
    vehicleId,
    stationId,
    onSuccess,
}) {
    const [currentStep, setCurrentStep] = useState(SWAP_STEPS.RETURN_BATTERY);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);

    // Cabinet/Slot states
    const [emptySlot, setEmptySlot] = useState(null);
    const [fullBatterySlot, setFullBatterySlot] = useState(null);
    const [batteryCheckStatus, setBatteryCheckStatus] = useState(null); // 'checking', 'passed', 'failed'

    // Final transaction data
    const [swapTransaction, setSwapTransaction] = useState(null);
    const [enrichedTransaction, setEnrichedTransaction] = useState(null);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setCurrentStep(SWAP_STEPS.RETURN_BATTERY);
            setErrors([]);
            setEmptySlot(null);
            setFullBatterySlot(null);
            setBatteryCheckStatus(null);
            setSwapTransaction(null);
            setEnrichedTransaction(null);
        }
    }, [open]);

    // Enrich transaction data with user and vehicle info
    useEffect(() => {
        if (!swapTransaction || currentStep !== SWAP_STEPS.SWAP_SUCCESS) return;

        const enrichData = async () => {
            try {
                const enriched = { ...swapTransaction };

                // Fetch user data
                if (userId) {
                    const userData = await userService.getUserById(userId);
                    enriched.user = userData;
                }

                // Fetch vehicle data
                if (vehicleId) {
                    const vehicleData = await vehicleService.getVehicleById(vehicleId);
                    enriched.vehicle = vehicleData;
                }

                setEnrichedTransaction(enriched);
            } catch (err) {
                console.error('Error enriching transaction data:', err);
                // Still set enriched even if fetch fails, use original data
                setEnrichedTransaction({ ...swapTransaction });
            }
        };

        enrichData();
    }, [swapTransaction, currentStep, userId, vehicleId]);

    // Get empty slot on mount
    useEffect(() => {
        if (!open || currentStep !== SWAP_STEPS.RETURN_BATTERY || emptySlot) return;

        const getSlot = async () => {
            setLoading(true);
            setErrors([]);

            try {
                const payload = {
                    user_id: userId,
                    vehicle_id: vehicleId,
                    station_id: stationId,
                };

                const slot = await swappingService.getEmptySlot(payload);
                setEmptySlot(slot);
            } catch (err) {
                console.error('Error getting empty slot:', err);
                setErrors([err?.response?.data?.message || 'Failed to get empty slot']);
            } finally {
                setLoading(false);
            }
        };

        getSlot();
    }, [open, currentStep, userId, vehicleId, stationId, emptySlot]);

    // Step 2: Return battery and move to health check
    const handleReturnBattery = async () => {
        setLoading(true);
        setErrors([]);

        try {
            if (!emptySlot || !emptySlot.cabinet || !emptySlot.slot) {
                setErrors(['Invalid empty slot information']);
                setLoading(false);
                return;
            }

            // Return battery using the same payload structure as AutoSwapDialog
            const response = await swappingService.returnBattery({
                user_id: userId,
                vehicle_id: vehicleId,
                station_id: stationId,
                cabinet_id: emptySlot.cabinet.cabinet_id,
                slot_id: emptySlot.slot.slot_id,
            });

            console.log('✅ Battery returned:', response);

            // Move to health check
            setBatteryCheckStatus('checking');
            setCurrentStep(SWAP_STEPS.CHECK_BATTERY_HEALTH);

            // Simulate health check (in reality, backend already checked in returnBattery)
            // Assume battery health is OK if we got here
            setTimeout(() => {
                setBatteryCheckStatus('passed');
            }, 1500);
        } catch (err) {
            console.error('❌ Error returning battery:', err);
            const msg = err?.response?.data?.message || 'Lỗi khi trả pin';

            // If error is SOH < 80, show failed status
            if (msg.includes('SOH') || msg.includes('80')) {
                setBatteryCheckStatus('failed');
                setCurrentStep(SWAP_STEPS.CHECK_BATTERY_HEALTH);
            } else {
                setErrors([msg]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Check battery health
    // Note: Battery health is already checked in returnBattery step, this is just for UI feedback
    const handleCheckBattery = async () => {
        setLoading(true);
        setErrors([]);

        try {
            // In AutoSwapDialog, the health check happens during returnBattery
            // If we got here, battery health is already OK
            // Just show the passed status after a brief delay
            setTimeout(() => {
                setBatteryCheckStatus('passed');
            }, 1000);
        } catch (err) {
            console.error('Error checking battery:', err);
            setBatteryCheckStatus('failed');
            setErrors([err?.response?.data?.message || 'Battery health check failed']);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Battery failed, go back
    const handleBatteryHealthFailed = () => {
        setCurrentStep(SWAP_STEPS.RETURN_BATTERY);
        setEmptySlot(null);
        setBatteryCheckStatus(null);
        toast.error('Battery health check failed. Please try another battery.');
    };

    // Step 3: Battery health check passed -> Get full battery slot
    const handleBatteryHealthPassed = async () => {
        setLoading(true);
        setErrors([]);

        try {
            const payload = {
                user_id: userId,
                vehicle_id: vehicleId,
                station_id: stationId,
                cabinet_id: stationId, // Use same cabinet as AutoSwapDialog
            };

            const slot = await swappingService.getFullSlot(payload);
            setFullBatterySlot(slot);
            setCurrentStep(SWAP_STEPS.COLLECT_BATTERY);
        } catch (err) {
            console.error('Error getting full slot:', err);
            setErrors([err?.response?.data?.message || 'Failed to get full battery']);
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Take new battery and complete swap
    const handleTakeBattery = async () => {
        setLoading(true);
        setErrors([]);

        try {
            if (!fullBatterySlot || !fullBatterySlot.battery) {
                setErrors(['Invalid battery information']);
                setLoading(false);
                return;
            }

            // Call API: take battery from cabinet (complete swap)
            const response = await swappingService.takeBattery({
                user_id: userId,
                vehicle_id: vehicleId,
                station_id: stationId,
                cabinet_id: fullBatterySlot.battery.cabinet_id,
                slot_id: fullBatterySlot.battery.slot_id,
                taken_battery_id: fullBatterySlot.battery.battery_id,
            });

            console.log('✅ Battery taken - Swap completed:', response);
            setSwapTransaction(response);
            setCurrentStep(SWAP_STEPS.SWAP_SUCCESS);

            toast.success('Battery swap successful!');
        } catch (err) {
            console.error('❌ Error taking battery:', err);
            const msg = err?.response?.data?.message || 'Error taking battery';
            setErrors([msg]);
        } finally {
            setLoading(false);
        }
    };

    // Step 5: Close dialog
    const handleSuccessClose = () => {
        onOpenChange(false);
        if (onSuccess) onSuccess(swapTransaction);
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Battery Swap Process</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {/* Error Messages */}
                    {errors.length > 0 && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            {errors.map((err, i) => (
                                <div key={i} className="flex gap-3 text-red-700 text-sm mb-2">
                                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                    <span>{err}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Return Battery */}
                    {currentStep === SWAP_STEPS.RETURN_BATTERY && emptySlot && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Return Old Battery</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                                <p className="text-sm text-gray-600 mb-2">Place old battery in:</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {emptySlot.cabinet?.cabinet_name || `Cabinet ${emptySlot.cabinet?.cabinet_id}`},
                                    Slot {emptySlot.slot?.slot_number}
                                </p>
                            </div>
                            <button
                                onClick={handleReturnBattery}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processing...' : (
                                    <>
                                        <span>Battery Placed</span>
                                        <ChevronRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 3: Check Battery Health */}
                    {currentStep === SWAP_STEPS.CHECK_BATTERY_HEALTH && (
                        <div className="space-y-4 text-center">
                            <h3 className="text-lg font-semibold text-gray-900">Check Battery Health</h3>
                            {batteryCheckStatus === 'checking' && (
                                <>
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto my-8" />
                                    <p className="text-gray-600">Analyzing battery SOH...</p>
                                    <button
                                        onClick={handleCheckBattery}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <span>Check Battery</span>
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}
                            {batteryCheckStatus === 'passed' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 my-8">
                                    <p className="text-2xl font-bold text-green-600 mb-2">✓ Battery OK</p>
                                    <p className="text-gray-600">SOH {'>='} 80%, proceeding to collect new battery...</p>
                                    <button
                                        onClick={handleBatteryHealthPassed}
                                        disabled={loading}
                                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Preparing...' : (
                                            <>
                                                <span>Next</span>
                                                <ChevronRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                            {batteryCheckStatus === 'failed' && (
                                <>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-8">
                                        <p className="text-2xl font-bold text-red-600 mb-2">✗ Battery Failed</p>
                                        <p className="text-gray-600">SOH {'<'} 80%, please try another battery.</p>
                                    </div>
                                    <button
                                        onClick={handleBatteryHealthFailed}
                                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                                    >
                                        Return & Try Again
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Step 4: Collect Battery */}
                    {currentStep === SWAP_STEPS.COLLECT_BATTERY && fullBatterySlot && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Collect New Battery</h3>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                <p className="text-sm text-gray-600 mb-2">Take new battery from:</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {fullBatterySlot.battery?.cabinet?.cabinet_name || `Cabinet ${fullBatterySlot.battery?.cabinet_id}`},
                                    Slot {fullBatterySlot.battery?.slot?.slot_number}
                                </p>
                                <p className="text-sm text-gray-500 mt-4">
                                    Charge Level: {fullBatterySlot.battery?.current_charge}%
                                </p>
                            </div>
                            <button
                                onClick={handleTakeBattery}
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Completing...' : (
                                    <>
                                        <span>Battery Taken</span>
                                        <ChevronRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {currentStep === SWAP_STEPS.SWAP_SUCCESS && swapTransaction && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                <p className="text-4xl mb-2">✓</p>
                                <h3 className="text-2xl font-bold text-green-600 mb-1">Swap Complete!</h3>
                                <p className="text-gray-600 text-sm">Battery swap transaction completed successfully</p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Driver Email</label>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {enrichedTransaction?.user?.email || 'Loading...'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Vehicle VIN</label>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {enrichedTransaction?.vehicle?.vin || 'Loading...'}
                                        </p>
                                    </div>
                                </div>




                                <div className="border-t border-gray-200 pt-3">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Completed At</label>
                                    <p className="text-sm text-gray-900 mt-1">
                                        {swapTransaction?.created_at
                                            ? new Date(swapTransaction.created_at).toLocaleString('vi-VN')
                                            : swapTransaction?.completed_at
                                                ? new Date(swapTransaction.completed_at).toLocaleString('vi-VN')
                                                : new Date().toLocaleString('vi-VN')
                                        }
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleSuccessClose}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
