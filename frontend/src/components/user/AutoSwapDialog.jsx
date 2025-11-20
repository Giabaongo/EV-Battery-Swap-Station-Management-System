import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { useStation } from '../../hooks/useContext';
import { swappingService } from '../../services/swappingService';
import { vehicleService } from '../../services/vehicleService';
import { batteryService } from '../../services/batteryService';
import { reservationService } from '../../services/reservationService';

/**
 * SWAP FLOW (Luồng tự động đổi pin với Cabinet/Slot):
 * 1. STATION_SELECTION - Chọn trạm (nút "Next")
 * 2. RETURN_BATTERY - Hướng dẫn trả pin vào trụ/khoang trống (popup cabinet-template)
 * 3. CHECK_BATTERY_HEALTH - Kiểm tra SOH >= 80%
 *    - Nếu < 80: Nhả pin ra, thông báo lỗi (error-battery-template)
 *    - Nếu >= 80: Chuyển sang COLLECT_BATTERY
 * 4. COLLECT_BATTERY - Hiển thị pin đầy sẽ nhận ở trụ/khoang nào (collect-new-template)
 * 5. SWAP_SUCCESS - Thành công, cảm ơn, nút quay về (swap-succes-template)
 */

const SWAP_STEPS = {
    STATION_SELECTION: 'station_selection',
    RETURN_BATTERY: 'return_battery',
    CHECK_BATTERY_HEALTH: 'check_battery_health',
    COLLECT_BATTERY: 'collect_battery',
    SWAP_SUCCESS: 'swap_success',
};

export default function AutoSwapDialog({ open, onOpenChange, userId, onSuccess }) {
    const { stations, getAvailableStations, loading: stationsLoading } = useStation();

    // Main step state
    const [currentStep, setCurrentStep] = useState(SWAP_STEPS.STATION_SELECTION);

    // Form data & UI states
    const [formData, setFormData] = useState({
        user_id: userId || '',
        vehicle_id: '',
        station_id: '',
    });

    const [vehicles, setVehicles] = useState([]);
    const [stationsWithBatteries, setStationsWithBatteries] = useState([]);
    const [stationSearch, setStationSearch] = useState('');
    const [selectedStation, setSelectedStation] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [scheduledReservation, setScheduledReservation] = useState(null);
    const [checkingReservation, setCheckingReservation] = useState(false);
    const searchRef = useRef(null);

    // Swap process states
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);

    // Step 2: Return Battery - Empty slot info
    const [emptySlot, setEmptySlot] = useState(null);

    // Step 3: Check Battery Health
    const [batteryCheckStatus, setBatteryCheckStatus] = useState(null); // 'checking', 'passed', 'failed'

    // Step 4: Collect Battery - Full battery slot info
    const [fullBatterySlot, setFullBatterySlot] = useState(null);

    // Final transaction data
    const [swapTransaction, setSwapTransaction] = useState(null);

    // ==================== EFFECTS ====================

    // Fetch available stations when dialog opens
    useEffect(() => {
        if (open && (!stations || stations.length === 0)) {
            getAvailableStations();
        }
    }, [open]);

    // Fetch user's vehicles when dialog opens
    useEffect(() => {
        const fetchVehicles = async () => {
            if (!open || !userId) return;

            try {
                const vehiclesData = await vehicleService.getVehicleByUserId(userId);
                const vehiclesList = Array.isArray(vehiclesData) ? vehiclesData : [];
                setVehicles(vehiclesList);

                // Auto-select first active vehicle if available
                const activeVehicle = vehiclesList.find(v => v.status === 'active');
                if (activeVehicle) {
                    setFormData(prev => ({ ...prev, vehicle_id: activeVehicle.vehicle_id }));
                    checkVehicleReservation(activeVehicle.vehicle_id);
                }
            } catch (err) {
                console.error('Error fetching vehicles:', err);
                setVehicles([]);
            }
        };

        fetchVehicles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, userId]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setCurrentStep(SWAP_STEPS.STATION_SELECTION);
            setFormData({ user_id: userId || '', vehicle_id: '', station_id: '' });
            setStationSearch('');
            setSelectedStation(null);
            setShowSuggestions(false);
            setErrors([]);
            setEmptySlot(null);
            setBatteryCheckStatus(null);
            setFullBatterySlot(null);
            setSwapTransaction(null);
        }
    }, [open, userId]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch batteries for each station
    useEffect(() => {
        const fetchBatteryData = async () => {
            if (!stations || stations.length === 0) {
                setStationsWithBatteries([]);
                return;
            }

            const stationsWithBatteryCounts = await Promise.all(
                stations.map(async (station) => {
                    try {
                        const stationId = station.station_id || station.id;
                        if (!stationId) return { ...station, available: 0, total: 0 };

                        const batteries = await batteryService.getBatteriesByStationId(stationId);
                        const availableBatteries = batteries.filter(
                            battery => battery.status === 'full' || battery.status === 'available'
                        ).length;
                        const totalBatteries = batteries.length;

                        return {
                            ...station,
                            station_id: stationId,
                            available: availableBatteries,
                            total: totalBatteries,
                        };
                    } catch (err) {
                        console.error('Error fetching batteries for station:', err);
                        return { ...station, available: 0, total: 0 };
                    }
                })
            );
            setStationsWithBatteries(stationsWithBatteryCounts);

            // Auto-select reserved station if we have a reservation
            if (scheduledReservation && scheduledReservation.station_id) {
                const reservedStation = stationsWithBatteryCounts.find(
                    s => s.station_id === scheduledReservation.station_id
                );
                if (reservedStation) {
                    setSelectedStation(reservedStation);
                    setStationSearch(reservedStation.name);
                    setFormData(prev => ({ ...prev, station_id: reservedStation.station_id }));
                }
            }
        };

        fetchBatteryData();
    }, [stations, scheduledReservation]);

    // ==================== HANDLERS ====================

    const checkVehicleReservation = async (vehicleId) => {
        if (!vehicleId || !userId) return;

        setCheckingReservation(true);
        try {
            const allReservations = await reservationService.getReservationsByUserId(userId);
            const scheduled = Array.isArray(allReservations)
                ? allReservations.find(res => res.vehicle_id === vehicleId && res.status === 'scheduled')
                : null;

            setScheduledReservation(scheduled || null);

            if (scheduled && scheduled.station_id) {
                setTimeout(() => {
                    const reservedStation = stationsWithBatteries.find(s => s.station_id === scheduled.station_id);
                    if (reservedStation) {
                        setSelectedStation(reservedStation);
                        setStationSearch(reservedStation.name);
                        setFormData(prev => ({ ...prev, station_id: reservedStation.station_id }));
                    }
                }, 100);
            } else {
                setSelectedStation(null);
                setStationSearch('');
                setFormData(prev => ({ ...prev, station_id: '' }));
            }
        } catch (err) {
            console.error('Error checking reservation:', err);
            setScheduledReservation(null);
        } finally {
            setCheckingReservation(false);
        }
    };

    const handleStationSearch = (e) => {
        const value = e.target.value;
        setStationSearch(value);
        setShowSuggestions(true);

        if (selectedStation) {
            setSelectedStation(null);
            setFormData(prev => ({ ...prev, station_id: '' }));
        }
    };

    const handleSelectStation = (station) => {
        setSelectedStation(station);
        setStationSearch(station.name);
        setFormData(prev => ({ ...prev, station_id: station.station_id }));
        setShowSuggestions(false);
        setErrors([]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors([]);

        if (name === 'vehicle_id' && value) {
            checkVehicleReservation(parseInt(value));
        }
    };

    // ==================== STEP HANDLERS ====================

    // Step 1: Station Selection -> Get Empty Slot for Return Battery
    const handleNextToReturnBattery = async () => {
        setErrors([]);

        if (!formData.vehicle_id) {
            setErrors(['Vui lòng chọn xe']);
            return;
        }

        if (!formData.station_id) {
            setErrors(['Vui lòng chọn trạm']);
            return;
        }

        setLoading(true);
        try {
            // Call API: get empty slot for returning battery
            const response = await swappingService.getEmptySlot({
                user_id: parseInt(formData.user_id, 10),
                vehicle_id: parseInt(formData.vehicle_id, 10),
                station_id: parseInt(formData.station_id, 10),
            });

            console.log('✅ Empty slot found:', response);
            setEmptySlot(response); // { cabinet, slot }
            setCurrentStep(SWAP_STEPS.RETURN_BATTERY);
        } catch (err) {
            console.error('❌ Error getting empty slot:', err);
            const msg = err?.response?.data?.message || 'Lỗi khi lấy khoang trống';
            setErrors([msg]);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Return Battery -> Check Battery Health
    const handleReturnBattery = async () => {
        setErrors([]);
        setLoading(true);

        try {
            if (!emptySlot || !emptySlot.cabinet || !emptySlot.slot) {
                setErrors(['Thông tin khoang trống không hợp lệ']);
                return;
            }

            // Call API: return battery to cabinet
            const response = await swappingService.returnBattery({
                user_id: parseInt(formData.user_id, 10),
                vehicle_id: parseInt(formData.vehicle_id, 10),
                station_id: parseInt(formData.station_id, 10),
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

    // Step 3: Battery Health Check Failed -> Eject Battery
    const handleBatteryHealthFailed = () => {
        // User needs to retrieve battery and contact staff
        // Reset to station selection or close dialog
        setCurrentStep(SWAP_STEPS.STATION_SELECTION);
        setBatteryCheckStatus(null);
        setEmptySlot(null);
        setErrors([]);
    };

    // Step 3: Battery Health Check Passed -> Get Full Battery Slot
    const handleBatteryHealthPassed = async () => {
        setLoading(true);
        setErrors([]);

        try {
            // Call API: get full battery slot to take
            const response = await swappingService.getFullSlot({
                user_id: parseInt(formData.user_id, 10),
                vehicle_id: parseInt(formData.vehicle_id, 10),
                station_id: parseInt(formData.station_id, 10),
                cabinet_id: parseInt(formData.station_id, 10), // Use same cabinet or allow selection
            });

            console.log('✅ Full battery slot found:', response);
            setFullBatterySlot(response); // { battery, battery.cabinet_id, battery.slot_id }
            setCurrentStep(SWAP_STEPS.COLLECT_BATTERY);
        } catch (err) {
            console.error('❌ Error getting full slot:', err);
            const msg = err?.response?.data?.message || 'Lỗi khi lấy pin đầy';
            setErrors([msg]);
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Collect Battery -> Take Battery (Complete Swap)
    const handleTakeBattery = async () => {
        setErrors([]);
        setLoading(true);

        try {
            if (!fullBatterySlot || !fullBatterySlot.battery) {
                setErrors(['Thông tin pin không hợp lệ']);
                return;
            }

            // Call API: take battery from cabinet (complete swap)
            const response = await swappingService.takeBattery({
                user_id: parseInt(formData.user_id, 10),
                vehicle_id: parseInt(formData.vehicle_id, 10),
                station_id: parseInt(formData.station_id, 10),
                cabinet_id: fullBatterySlot.battery.cabinet_id,
                slot_id: fullBatterySlot.battery.slot_id,
                taken_battery_id: fullBatterySlot.battery.battery_id,
            });

            console.log('✅ Battery taken - Swap completed:', response);
            setSwapTransaction(response);
            setCurrentStep(SWAP_STEPS.SWAP_SUCCESS);

            toast.success('Đổi pin thành công!');
        } catch (err) {
            console.error('❌ Error taking battery:', err);
            const msg = err?.response?.data?.message || 'Lỗi khi lấy pin';
            setErrors([msg]);
        } finally {
            setLoading(false);
        }
    };

    // Step 5: Success -> Close Dialog
    const handleSuccessClose = () => {
        onOpenChange(false);

        if (onSuccess) {
            onSuccess(swapTransaction);
        }
    };

    // Filter stations by search
    const filteredStations = stationsWithBatteries.filter(station => {
        const searchLower = stationSearch.toLowerCase();
        const name = (station.name || '').toLowerCase();
        const address = (station.address || '').toLowerCase();
        return name.includes(searchLower) || address.includes(searchLower);
    });

    // ==================== RENDER ====================

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                {/* STEP 1: Station Selection */}
                {currentStep === SWAP_STEPS.STATION_SELECTION && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Chọn Trạm Đổi Pin</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Vehicle Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chọn Xe
                                </label>
                                <select
                                    name="vehicle_id"
                                    value={formData.vehicle_id}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">-- Chọn Xe --</option>
                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                                            {vehicle.vin} - {vehicle.battery_model || 'Unknown Model'}
                                            {vehicle.status === 'active' ? ' (Active)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {vehicles.length === 0 && (
                                    <>
                                        <p className="text-sm text-gray-500 mt-1">Không có xe nào</p>
                                        <Link
                                            to="/driver/profile"
                                            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mt-2"
                                        >
                                            Thêm Xe
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Station Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {scheduledReservation ? '📍 Trạm Đặt Trước' : 'Tìm Trạm'}
                                </label>

                                {scheduledReservation && selectedStation ? (
                                    <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-md">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-semibold text-amber-900 text-lg">
                                                    {selectedStation.name}
                                                </div>
                                                <div className="text-sm text-amber-700 mt-2">
                                                    {selectedStation.address}
                                                </div>
                                                <div className="text-xs text-green-600 mt-2 font-semibold">
                                                    ✓ {selectedStation.available} pin sẵn sàng
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-amber-600 mt-3 italic flex items-center gap-1">
                                            🔐 Trạm từ lịch đặt trước của bạn
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative" ref={searchRef}>
                                        <input
                                            type="text"
                                            value={stationSearch}
                                            onChange={handleStationSearch}
                                            onFocus={() => setShowSuggestions(true)}
                                            placeholder="Nhập tên trạm..."
                                            className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            autoComplete="off"
                                            disabled={checkingReservation}
                                        />

                                        {checkingReservation && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                            </div>
                                        )}

                                        {showSuggestions && !checkingReservation && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {(stationSearch ? filteredStations : stationsWithBatteries).length > 0 ? (
                                                    (stationSearch ? filteredStations : stationsWithBatteries).map((station) => (
                                                        <div
                                                            key={station.station_id}
                                                            onClick={() => handleSelectStation(station)}
                                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                                        >
                                                            <div className="font-medium text-gray-900">{station.name}</div>
                                                            <div className="text-sm text-gray-600">{station.address}</div>
                                                            <div className="text-xs text-green-600 mt-1">
                                                                {station.available} pin sẵn sàng
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-sm text-gray-500 text-center">
                                                        {stationSearch
                                                            ? `Không tìm thấy trạm "${stationSearch}"`
                                                            : 'Không có trạm nào với pin sẵn sàng'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {selectedStation && !showSuggestions && !scheduledReservation && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                                <div className="text-sm font-medium text-blue-900">{selectedStation.name}</div>
                                                <div className="text-xs text-blue-700">{selectedStation.address}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {stationsLoading ? (
                                    <p className="text-sm text-gray-500 mt-1">Đang tải trạm...</p>
                                ) : stationsWithBatteries.length === 0 && !scheduledReservation ? (
                                    <p className="text-sm text-gray-500 mt-1">Không có trạm với pin sẵn sàng</p>
                                ) : null}
                            </div>

                            {/* Error Messages */}
                            {errors && errors.length > 0 && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                    {errors.length === 1 ? (
                                        <p className="text-sm text-red-700">{errors[0]}</p>
                                    ) : (
                                        <ul className="list-disc ml-5 text-sm text-red-700">
                                            {errors.map((err, idx) => (
                                                <li key={idx}>{err}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Huỷ
                            </Button>
                            <Button
                                disabled={loading || !formData.vehicle_id || !formData.station_id}
                                onClick={handleNextToReturnBattery}
                            >
                                {loading ? 'Đang xử lý...' : 'Tiếp Theo'}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* STEP 2: Return Battery - Instruction to place battery in slot */}
                {currentStep === SWAP_STEPS.RETURN_BATTERY && emptySlot && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Trả Pin Vào Trụ</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="text-center">
                                <p className="text-gray-600 text-lg mb-4">Vui lòng để pin của bạn vào:</p>
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                                    <p className="text-gray-500 text-sm mb-2">Trụ/Khoang:</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {emptySlot.cabinet?.cabinet_name || `Cabinet ${emptySlot.cabinet?.cabinet_id}`},
                                        Slot {emptySlot.slot?.slot_number}
                                    </p>
                                </div>
                            </div>

                            {errors && errors.length > 0 && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                    <p className="text-sm text-red-700">{errors[0]}</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setCurrentStep(SWAP_STEPS.STATION_SELECTION);
                                    setEmptySlot(null);
                                }}
                                disabled={loading}
                            >
                                Quay Lại
                            </Button>
                            <Button disabled={loading} onClick={handleReturnBattery}>
                                {loading ? 'Đang xử lý...' : 'Tiếp Theo'}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* STEP 3: Check Battery Health */}
                {currentStep === SWAP_STEPS.CHECK_BATTERY_HEALTH && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Kiểm Tra Tình Trạng Pin</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {batteryCheckStatus === 'checking' && (
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Đang kiểm tra tình trạng pin...</p>
                                </div>
                            )}

                            {batteryCheckStatus === 'passed' && (
                                <div className="text-center">
                                    <div className="flex justify-center mb-4">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-3xl">✓</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 font-medium">Pin của bạn sẵn sàng!</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Tiến hành lấy pin đầy từ trụ
                                    </p>
                                </div>
                            )}

                            {batteryCheckStatus === 'failed' && (
                                <div className="text-center">
                                    <div className="flex justify-center mb-4">
                                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                            <span className="text-3xl text-red-600">!</span>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-red-600 mb-2">
                                        Tình Trạng Pin Dưới Tiêu Chuẩn
                                    </h3>
                                    <p className="text-gray-700 mb-4">
                                        Mức sức khỏe pin (SOH) của bạn dưới 80% và không đủ điều kiện để đổi.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Vui lòng lấy pin ra khỏi khoang và liên hệ nhân viên hỗ trợ để xử lý.
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            {batteryCheckStatus === 'failed' && (
                                <>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleBatteryHealthFailed}
                                        disabled={loading}
                                    >
                                        Quay Lại
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleBatteryHealthFailed}
                                        disabled={loading}
                                    >
                                        Liên Hệ Nhân Viên
                                    </Button>
                                </>
                            )}

                            {batteryCheckStatus === 'passed' && (
                                <Button
                                    disabled={loading}
                                    onClick={handleBatteryHealthPassed}
                                    className="w-full"
                                >
                                    {loading ? 'Đang xử lý...' : 'Tiếp Theo'}
                                </Button>
                            )}
                        </DialogFooter>
                    </>
                )}

                {/* STEP 4: Collect Battery - Show full battery location */}
                {currentStep === SWAP_STEPS.COLLECT_BATTERY && fullBatterySlot && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Lấy Pin Đầy</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-3xl">🔋</span>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-lg mb-4">Pin đầy của bạn sẵn sàng ở:</p>
                                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                                    <p className="text-gray-500 text-sm mb-2">Trụ/Khoang:</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {fullBatterySlot.battery?.cabinet?.cabinet_name || `Cabinet ${fullBatterySlot.battery?.cabinet_id}`},
                                        Slot {fullBatterySlot.battery?.slot?.slot_number}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Mức sạc: {fullBatterySlot.battery?.current_charge}%
                                </p>
                            </div>

                            {errors && errors.length > 0 && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                    <p className="text-sm text-red-700">{errors[0]}</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setCurrentStep(SWAP_STEPS.CHECK_BATTERY_HEALTH);
                                    setFullBatterySlot(null);
                                }}
                                disabled={loading}
                            >
                                Quay Lại
                            </Button>
                            <Button disabled={loading} onClick={handleTakeBattery} className="w-full">
                                {loading ? 'Đang xử lý...' : 'Hoàn Thành Đổi Pin'}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* STEP 5: Swap Success */}
                {currentStep === SWAP_STEPS.SWAP_SUCCESS && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Đổi Pin Thành Công</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-6">
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-5xl">✓</span>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Chúc Mừng!
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Pin của bạn đã được đổi thành công. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
                                </p>
                            </div>

                            {swapTransaction && (
                                <div className="bg-gray-50 rounded-lg overflow-hidden divide-y divide-gray-200">
                                    <div className="flex justify-between gap-x-6 p-4">
                                        <p className="text-slate-500 text-sm">Người dùng</p>
                                        <p className="text-slate-900 text-sm font-medium text-right">
                                            {swapTransaction.vehicle?.user?.username || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex justify-between gap-x-6 p-4">
                                        <p className="text-slate-500 text-sm">Trạm</p>
                                        <p className="text-slate-900 text-sm font-medium text-right">
                                            {selectedStation?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex justify-between gap-x-6 p-4">
                                        <p className="text-slate-500 text-sm">Xe</p>
                                        <p className="text-slate-900 text-sm font-medium text-right">
                                            {swapTransaction.vehicle?.vin || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex justify-between gap-x-6 p-4">
                                        <p className="text-slate-500 text-sm">Mã giao dịch</p>
                                        <p className="text-slate-900 text-sm font-mono font-semibold text-right">
                                            {swapTransaction.swapTransaction?.transaction_id || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button onClick={handleSuccessClose} className="w-full">
                                Quay Về Trang Chủ
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
