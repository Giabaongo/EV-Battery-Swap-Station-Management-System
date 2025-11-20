import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useBattery, useAuth, useSubscription, usePackage } from '../../hooks/useContext';
import { swappingService } from '../../services/swappingService';
import { vehicleService } from '../../services/vehicleService';
import { reservationService } from '../../services/reservationService';
import { subscriptionService } from '../../services/subscriptionService';
import { stationService } from '../../services/stationService';
import userService from '../../services/userService';
import TransactionsTable from '../staff-dashboard/TransactionsTable';

export default function ManualSwapTransaction() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { getAllBatteries } = useBattery();
    const { user } = useAuth(); // Get logged-in staff info
    const { getActiveSubscription } = useSubscription();
    const { getPackageById } = usePackage();

    // Start as true if Luồng 1 (reservationId exists), false nếu Luồng 2
    const [loading, setLoading] = useState(!!searchParams.get('reservationId'));
    const [_vehicleData, setVehicleData] = useState(null);
    const [userVehicles, setUserVehicles] = useState([]);
    const [username, setUsername] = useState(''); // Username for Luồng 1
    const [vehicleVin, setVehicleVin] = useState(''); // VIN for Luồng 1

    // Track fetched user_id to prevent infinite loop
    const [fetchedUserId, setFetchedUserId] = useState(null);

    // Email search states for Luồng 2
    const [userEmail, setUserEmail] = useState('');
    const [foundUser, setFoundUser] = useState(null);
    const [emailSearching, setEmailSearching] = useState(false);
    const [emailError, setEmailError] = useState('');

    // Station name for display (fetch from stationId)
    const [stationName, setStationName] = useState('');

    // Get data from URL params (passed from staff request list in Luồng 1)
    const reservationId = searchParams.get('reservationId');
    const urlUserId = searchParams.get('userId');
    const urlVehicleId = searchParams.get('vehicleId');
    const urlBatteryReturnedId = searchParams.get('batteryReturnedId');
    const urlSubscriptionId = searchParams.get('subscriptionId');
    const _subscriptionName = searchParams.get('subscriptionName');
    const _vin = searchParams.get('vin');

    // Staff's station_id from logged-in user
    const staffStationId = user?.station_id ? parseInt(user.station_id) : null;

    // minimal debug: station id available via `staffStationId`

    const [formData, setFormData] = useState({
        user_id: urlUserId || '',
        vehicle_id: urlVehicleId || '',
        station_id: staffStationId || '',
        subscription_id: urlSubscriptionId && urlSubscriptionId !== 'null' && urlSubscriptionId !== 'undefined' ? urlSubscriptionId : '', // Keep ID for API
        subscription_name: _subscriptionName || '', // Add name for display
        battery_taken_id: searchParams.get('batteryId') || '',
        subscription_battery_returned_id: urlBatteryReturnedId || '',
    });
    const [apiErrors, setApiErrors] = useState([]);

    // Submit button loading state to prevent duplicate submissions
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Map backend error responses to friendly UI messages
    const mapServerErrorToMessage = (resp) => {
        // Try to normalize message(s) into an array
        const msgs = [];
        const raw = resp?.message ?? resp?.error ?? null;

        if (Array.isArray(raw)) {
            raw.forEach(r => msgs.push(String(r)));
        } else if (typeof raw === 'string' && raw) {
            msgs.push(raw);
        } else if (resp && typeof resp === 'string') {
            msgs.push(resp);
        }

        // If there's a specific subscription/vehicle mismatch, return the localized friendly message
        const subscriptionMismatch = msgs.find(m => typeof m === 'string' && /Subscription with ID/i.test(m));
        if (subscriptionMismatch) {
            // Try to get VIN for the selected vehicle
            const selectedVehicleId = formData.vehicle_id || urlVehicleId;
            let vin = _vehicleData?.vin || null;
            if (!vin && selectedVehicleId && Array.isArray(userVehicles)) {
                const found = userVehicles.find(v => String(v.vehicle_id) === String(selectedVehicleId));
                vin = found?.vin || found?.plate || null;
            }

            const idOrVin = vin ? String(vin) : `ID ${selectedVehicleId}`;
            return [`User's vehicle (${idOrVin}) is not registered for a battery swap subscription, please register a subscription`];
        }

        // Fallback: return original messages if any, otherwise a generic message
        if (msgs.length > 0) return msgs;
        return ['An error occurred, please try again or contact support.'];
    };

    // Update station_id when user changes (but don't trigger loading)
    useEffect(() => {
        if (staffStationId && formData.station_id !== staffStationId.toString()) {
            setFormData(prev => ({
                ...prev,
                station_id: staffStationId.toString()
            }));
        }
    }, [staffStationId, formData.station_id]);

    // Fetch station name from staffStationId (not from formData.station_id)
    useEffect(() => {
        if (!staffStationId) {
            setStationName('');
            return;
        }

        const fetchStationName = async () => {
            try {
                const station = await stationService.getStationById(staffStationId);
                console.log('📍 Full station object:', station);
                console.log('📍 All station keys:', station ? Object.keys(station) : 'null');

                // Try different field names for station name
                const name = station?.name
                    || `Station ${staffStationId}`;

                setStationName(name);
                console.log('✅ Resolved station name:', name);
            } catch (err) {
                console.warn('❌ Failed to fetch station name:', err);
                setStationName(`Station ${staffStationId}`);
            }
        };

        fetchStationName();
    }, [staffStationId]);

    // Handler to search user by email (Luồng 2)
    const handleEmailSearch = async () => {
        if (!userEmail || !userEmail.includes('@')) {
            setEmailError('Please enter a valid email address');
            return;
        }

        setEmailSearching(true);
        setEmailError('');
        setFoundUser(null);

        try {
            const userData = await userService.getUserByEmail(userEmail);
            if (userData && userData.user_id) {
                setFoundUser(userData);
                // Reset form và set user_id, vehicles sẽ load trong useEffect
                setFormData(prev => ({
                    ...prev,
                    user_id: userData.user_id.toString(),
                    vehicle_id: '',
                    subscription_id: '',
                    subscription_name: ''
                }));
                setEmailError('');
            } else {
                setEmailError('Cannot find user with this email');
            }
        } catch (error) {
            console.error('Error searching user by email:', error);
            if (error.response?.status === 404) {
                setEmailError('Cannot find user with this email');
            } else {
                setEmailError('Error searching user, please try again');
            }
        } finally {
            setEmailSearching(false);
        }
    };

    // Luồng 2: When staff manually enters user_id, fetch user's vehicles
    useEffect(() => {
        if (reservationId || !formData.user_id) {
            return;
        }

        const currentUserId = parseInt(formData.user_id);
        if (isNaN(currentUserId)) {
            return;
        }

        // Prevent infinite loop: only fetch if user_id changed
        if (currentUserId === fetchedUserId) {
            return;
        }

        const fetchUserVehicles = async () => {
            try {
                console.log('🔄 Fetching vehicles for userId:', currentUserId);

                // Fetch user's vehicles so staff can choose
                try {
                    const vehiclesResp = await vehicleService.getVehicleByUserId(currentUserId);
                    const vehArr = Array.isArray(vehiclesResp) ? vehiclesResp : (vehiclesResp ? [vehiclesResp] : []);
                    setUserVehicles(vehArr);
                } catch {
                    console.warn('⚠️ Failed to fetch vehicles for user:', currentUserId);
                    setUserVehicles([]);
                }

                // Mark this user_id as fetched
                setFetchedUserId(currentUserId);
            } catch (error) {
                console.error('❌ Error fetching user vehicles:', error);
                setFetchedUserId(currentUserId); // Mark as fetched even on error to prevent retry loop
            }
        };

        fetchUserVehicles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.user_id, reservationId]);

    // 3. Update trong Luồng 1 useEffect (khi có reservationId)
    useEffect(() => {
        if (!reservationId || !urlVehicleId) {
            return;
        }

        const fetchVehicleData = async () => {
            try {
                // Set user_id from URL params first (Luồng 1 always has urlUserId)
                if (urlUserId) {
                    setFormData(prev => ({ ...prev, user_id: String(urlUserId) }));

                    // Fetch username từ user_id
                    try {
                        const userData = await userService.getUserById(parseInt(urlUserId));
                        setUsername(userData?.username || '');
                        console.log('✅ Username fetched:', userData?.username);
                    } catch (err) {
                        console.error('❌ Error fetching username:', err);
                    }
                }

                const vehicle = await vehicleService.getVehicleById(urlVehicleId);
                setVehicleData(vehicle);

                // Set VIN từ vehicle
                if (vehicle?.vin) {
                    setVehicleVin(vehicle.vin);
                    console.log('✅ VIN fetched:', vehicle.vin);
                }

                if (vehicle?.vehicle_id) setFormData(prev => ({ ...prev, vehicle_id: String(vehicle.vehicle_id) }));
                if (vehicle?.battery_id) setFormData(prev => ({ ...prev, battery_returned_id: String(vehicle.battery_id) }));

                if (!urlSubscriptionId && urlUserId) {
                    try {
                        const subscription = await getActiveSubscription(parseInt(urlUserId));
                        if (subscription) {
                            const packageName = subscription.package?.package_name || subscription.package?.name || 'Chưa đăng ký';
                            setFormData(prev => ({ ...prev, subscription_id: subscription.subscription_id.toString(), subscription_name: packageName }));
                        }
                    } catch (subErr) {
                        console.error('Error fetching subscription:', subErr);
                    }
                }
            } catch (err) {
                console.error('Error fetching vehicle data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicleData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reservationId, urlVehicleId, urlUserId, urlSubscriptionId]);

    // When vehicle_id changes (manual selection in Luồng 2), fetch vehicle details AND subscription
    useEffect(() => {
        if (!formData.vehicle_id) return;
        // avoid refetch during reservation flow where we already fetched
        if (reservationId && urlVehicleId) return;

        const currentVehicleId = parseInt(formData.vehicle_id);
        if (isNaN(currentVehicleId)) return;

        const fetchVehicleAndSubscription = async () => {
            try {
                console.log('🔄 Fetching vehicle details and subscription for vehicleId:', currentVehicleId);

                const vehicle = await vehicleService.getVehicleById(currentVehicleId);
                setVehicleData(vehicle);

                // Set battery_returned_id (or empty for first swap)
                if (vehicle?.battery_id) {
                    setFormData(prev => ({ ...prev, battery_returned_id: String(vehicle.battery_id) }));
                } else {
                    setFormData(prev => ({ ...prev, battery_returned_id: '' }));
                }

                // Fetch subscription for this specific vehicle (Luồng 2 only)
                if (!reservationId && formData.user_id) {
                    try {
                        const currentUserId = parseInt(formData.user_id);
                        // Get ALL subscriptions of user (not just active one)
                        const subscriptions = await subscriptionService.getSubscriptionsByUserId(currentUserId);

                        console.log('📦 All user subscriptions:', subscriptions);

                        // Find the subscription matching this vehicle
                        let subscription = null;
                        if (Array.isArray(subscriptions) && subscriptions.length > 0) {
                            subscription = subscriptions.find(sub =>
                                sub.vehicle_id === currentVehicleId &&
                                sub.status === 'active'
                            );
                        }

                        if (subscription) {
                            console.log('✅ Found active subscription for vehicle:', subscription);

                            // Get package name from subscription
                            let packageName = subscription.package?.package_name
                                || subscription.package?.name
                                || 'You are not subscribed';

                            // If package not included, try to fetch it
                            if (packageName === 'You are not subscribed' && subscription.package_id) {
                                try {
                                    const pkg = await getPackageById(subscription.package_id);
                                    packageName = pkg?.package_name || pkg?.name || 'You are not subscribed';
                                } catch (err) {
                                    console.warn('Failed to fetch package:', err);
                                }
                            }

                            setFormData(prev => ({
                                ...prev,
                                subscription_id: subscription.subscription_id.toString(),
                                subscription_name: packageName
                            }));
                        } else {
                            // No active subscription for this vehicle
                            console.warn('⚠️ No active subscription found for vehicle:', currentVehicleId);
                            setFormData(prev => ({
                                ...prev,
                                subscription_id: '',
                                subscription_name: 'You are not subscribed'
                            }));
                        }
                    } catch (err) {
                        console.error('❌ Error fetching subscription:', err);
                        setFormData(prev => ({
                            ...prev,
                            subscription_id: '',
                            subscription_name: 'You are not subscribed'
                        }));
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch vehicle:', err);
            }
        };

        fetchVehicleAndSubscription();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.vehicle_id, reservationId]);

    // If we have a reservationId (Luồng 1), fetch reservation details and prefill battery_taken_id
    useEffect(() => {
        if (!reservationId) return;

        // Prefill battery_taken_id from URL if available (Luồng 1)
        const batteryIdFromUrl = searchParams.get('batteryId');
        if (batteryIdFromUrl) {
            setFormData(prev => ({
                ...prev,
                battery_taken_id: batteryIdFromUrl
            }));
        }

        // Optionally still fetch reservation for other info
        const fetchReservation = async () => {
            try {
                let res = await reservationService.getReservationById(parseInt(reservationId));

                // If reservation includes vehicle_id, ensure formData has it for backend validation
                if (res && res.vehicle_id) {
                    setFormData(prev => ({
                        ...prev,
                        vehicle_id: String(res.vehicle_id),
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch reservation details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReservation();
    }, [reservationId, searchParams]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['vehicle_id', 'user_id', 'battery_taken_id'].includes(name)) setApiErrors([]);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Prevent duplicate submissions
            if (isSubmitting) return;
            setIsSubmitting(true);

            // Clear previous API errors
            setApiErrors([]);

            const userIdPayload = parseInt(formData.user_id) || parseInt(urlUserId) || user?.id;
            const vehicleIdPayload = parseInt(formData.vehicle_id) || parseInt(urlVehicleId);
            const stationIdPayload = parseInt(formData.station_id) || staffStationId;

            if (isNaN(userIdPayload) || isNaN(vehicleIdPayload) || isNaN(stationIdPayload)) {
                setApiErrors(['User ID, Vehicle ID, and Station ID are required']);
                setIsSubmitting(false);
                return;
            }

            // Backend auto-selects battery, we only need to send user_id, vehicle_id, station_id
            const swapPayload = {
                user_id: userIdPayload,
                vehicle_id: vehicleIdPayload,
                station_id: stationIdPayload
            };

            console.log('🚀 Creating swap transaction with payload:', swapPayload);

            // Call backend swapping endpoint which handles everything automatically
            const resp = await swappingService.swapBatteries(swapPayload);
            console.log('✅ Swap transaction created:', resp);

            // If this was a reservation flow, backend already updated reservation status to completed
            if (reservationId) {
                console.log('📋 Reservation', reservationId, 'marked as completed by backend');
            }

            // Refresh battery list
            try {
                if (typeof getAllBatteries === 'function') {
                    await getAllBatteries();
                }
            } catch (refreshErr) {
                console.warn('Failed to refresh batteries after swap:', refreshErr);
            }

            // Show toast notification instead of alert
            if (window && window.toast) {
                window.toast.success('Swap transaction completed successfully!');
            } else if (typeof toast !== 'undefined') {
                toast.success('Swap transaction completed successfully!');
            } else {
                // fallback: alert
                alert('Swap transaction completed successfully!');
            }
            setIsSubmitting(false);
            navigate('/staff/swap-requests');
        } catch (error) {
            console.error('❌ Error creating swap transaction:', error);
            const resp = error?.response?.data;
            setApiErrors(mapServerErrorToMessage(resp));
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // If modal is open, close it. Otherwise navigate back to staff home.
        if (showModal) {
            setShowModal(false);

            // If this was Luồng 1 (reservationId in URL), clear the URL params so they don't re-trigger modal on Luồng 2
            if (reservationId) {
                console.log('🔄 Closing Luồng 1 popup - clearing URL params and resetting form');
                // Reset form data to empty
                setFormData({
                    user_id: '',
                    vehicle_id: '',
                    station_id: staffStationId || '',
                    subscription_id: '',
                    subscription_name: '',
                    battery_taken_id: '',
                    subscription_battery_returned_id: '',
                });
                // Reset display states
                setUsername('');
                setVehicleVin('');
                setUserVehicles([]);
                setApiErrors([]);
                // Clear URL
                navigate('/staff/manual-swap', { replace: true, state: null });
            }
            return;
        }
        navigate('/staff');
    };

    // Auto-open modal only when navigation sets the open flag (from "Process Request").
    // We prefer navigation state (location.state.openSwapModal) so the modal does NOT open on page reloads
    // even if reservationId is present in the URL.
    const location = useLocation();
    const openedFromRequest = Boolean(location?.state?.openSwapModal);

    const [showModal, setShowModal] = useState(openedFromRequest);

    // If opened from a navigation that set state, clear that history state so refreshing the page
    // won't leave the flag set and re-open the modal.
    useEffect(() => {
        if (!openedFromRequest) return;

        try {
            // replace current history entry with same URL but no state
            navigate(location.pathname + location.search, { replace: true, state: null });
        } catch (err) {
            // non-fatal; navigation replace may fail in some test environments
            console.warn('Failed to clear navigation state after opening modal:', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading vehicle data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Page Heading */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div className="flex min-w-72 flex-col gap-2">
                            <p className="text-gray-900 dark:text-gray-50 text-3xl font-black leading-tight tracking-tight">
                                Transaction History - {user?.station?.name || 'Station'}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                                View and manage all battery swap transactions for this station.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold leading-normal tracking-[0.015em] gap-2 shadow-sm hover:bg-blue-600/90"
                        >
                            <span className="material-icons text-base">add</span>
                            <span className="truncate">Create Manual Swap</span>
                        </button>
                    </div>

                    {/* Transaction Table */}
                    <div className="mt-6">
                        <TransactionsTable />
                    </div>
                </div>
            </main>

            {/* Modal popup for Create New Swap Transaction */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
                    <div className="relative w-[920px] max-w-[calc(100%-2rem)] max-h-[90vh] overflow-auto mx-4 bg-white p-8 rounded-lg shadow-md z-10">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Create New Swap Transaction</h2>
                            <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Username - Luồng 1 only */}
                                {reservationId && (
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="username">
                                            Username
                                        </label>
                                        <div className="relative">
                                            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">person</span>
                                            <input
                                                type="text"
                                                id="username"
                                                name="username"
                                                value={username}
                                                className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* User Email Search (Luồng 2) or User ID (Luồng 1) */}
                                {!reservationId ? (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="user_email">
                                            Driver Email
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">email</span>
                                                <input
                                                    type="email"
                                                    id="user_email"
                                                    value={userEmail}
                                                    onChange={(e) => {
                                                        setUserEmail(e.target.value);
                                                        setEmailError('');
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleEmailSearch();
                                                        }
                                                    }}
                                                    className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter driver email..."
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleEmailSearch}
                                                disabled={emailSearching || !userEmail}
                                                className={`px-6 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 ${emailSearching || !userEmail
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                            >
                                                {emailSearching ? (
                                                    <>
                                                        <span className="material-icons animate-spin">refresh</span>
                                                        Searching...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-icons">search</span>
                                                        Search
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {emailError && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                <span className="material-icons text-sm">error</span>
                                                {emailError}
                                            </p>
                                        )}
                                        {foundUser && (
                                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                                <p className="text-sm text-green-700 flex items-center gap-2">
                                                    <span className="material-icons text-lg">check_circle</span>
                                                    <span>
                                                        <strong>{foundUser.username}</strong> (ID: {foundUser.user_id})
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="user_id">
                                            User ID
                                        </label>
                                        <div className="relative">
                                            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">person</span>
                                            <input
                                                type="text"
                                                id="user_id"
                                                name="user_id"
                                                value={formData.user_id}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Vehicle VIN - Luồng 1 shows VIN, Luồng 2 shows Vehicle dropdown */}
                                <div className="min-w-0">
                                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="vehicle_id">
                                        {reservationId ? 'Vehicle VIN' : 'Vehicle ID'}
                                    </label>
                                    <div className="relative">
                                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">electric_scooter</span>
                                        {reservationId ? (
                                            <input
                                                type="text"
                                                id="vehicle_id"
                                                name="vehicle_id"
                                                value={vehicleVin || formData.vehicle_id}
                                                className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                                                readOnly
                                            />
                                        ) : (
                                            <select
                                                id="vehicle_id"
                                                name="vehicle_id"
                                                value={formData.vehicle_id}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="">Select vehicle...</option>
                                                {userVehicles && userVehicles.length > 0 ? (
                                                    userVehicles.map(v => (
                                                        <option key={v.vehicle_id} value={v.vehicle_id}>
                                                            {`VEH${String(v.vehicle_id).padStart(3, '0')} ${v.vin ? `- ${v.vin}` : v.plate ? `- ${v.plate}` : ''}`}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="">No vehicles found for this user</option>
                                                )}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                {/* Station ID */}
                                <div className="min-w-0">
                                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="station_id">
                                        Station Name
                                    </label>
                                    <div className="relative">
                                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">ev_station</span>
                                        <input
                                            type="text"
                                            id="station_id"
                                            name="station_id"
                                            value={stationName || formData.station_id}
                                            className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                                            readOnly
                                        />
                                    </div>
                                </div>

                                {/* Subscription name */}
                                <div className="min-w-0">
                                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="subscription_name">
                                        Package Name
                                    </label>
                                    <div className="relative">
                                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">card_membership</span>
                                        <input
                                            type="text"
                                            id="subscription_name"
                                            name="subscription_name"
                                            value={formData.subscription_name || 'Chưa đăng ký'}
                                            onChange={handleChange}
                                            className={`w-full pl-12 pr-4 py-2 border rounded-md ${formData.subscription_name && formData.subscription_name !== 'Chưa đăng ký'
                                                ? 'bg-gray-50 border-gray-300 text-gray-900'
                                                : 'bg-red-50 border-red-300 text-red-600'
                                                } focus:ring-green-500 focus:border-green-500`}
                                            placeholder="Subscription Name"
                                            readOnly
                                        />
                                    </div>
                                    {(!formData.subscription_name || formData.subscription_name === 'Chưa đăng ký') && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <span className="material-icons text-sm">warning</span>
                                            User must have an active subscription
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2 border-t border-gray-300 my-2"></div>

                                {/* Battery Taken ID - Only show in Luồng 1 (Reservation) */}
                                {reservationId && (
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="battery_taken_id">
                                            Battery Taken ID (Reserved)
                                        </label>
                                        <div className="relative">
                                            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-xl">battery_charging_full</span>
                                            <input
                                                type="text"
                                                id="battery_taken_id"
                                                name="battery_taken_id"
                                                value={formData.battery_taken_id}
                                                readOnly
                                                className="w-full pl-12 pr-4 py-2 bg-green-50 border border-green-300 rounded-md text-green-700"
                                            />
                                        </div>
                                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                            <span className="material-icons text-sm">check_circle</span>
                                            Battery reserved for this request
                                        </p>
                                    </div>
                                )}

                                {/* Battery Returned ID - Only show in Luồng 1 (Reservation) */}
                                {reservationId && (
                                    <div className="min-w-0">
                                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="battery_returned_id">
                                            Battery Returned ID
                                        </label>
                                        <div className="relative">
                                            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-xl">battery_alert</span>
                                            <input
                                                type="text"
                                                id="battery_returned_id"
                                                name="battery_returned_id"
                                                value={formData.battery_returned_id}
                                                className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                                                placeholder="Auto-filled from vehicle"
                                                readOnly
                                            />
                                        </div>
                                        <p className="text-xs text-orange-600 mt-1">
                                            Battery returned by driver (to be charged)
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* API validation errors from backend */}
                            {apiErrors && apiErrors.length > 0 && (
                                <div className="md:col-span-2 mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                    <p className="font-semibold text-red-700 mb-2">Server validation errors:</p>
                                    <ul className="list-disc ml-5 text-sm text-red-600">
                                        {apiErrors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-8 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 rounded-md bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!formData.user_id || !formData.vehicle_id || !formData.station_id || isSubmitting}
                                    className={`px-6 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 ${(formData.user_id && formData.vehicle_id && formData.station_id && !isSubmitting)
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-icons animate-spin">refresh</span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons">add_circle_outline</span>
                                            Create Transaction
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
