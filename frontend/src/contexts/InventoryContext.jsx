import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { stationService } from "../services/stationService";
import { batteryService } from "../services/batteryService";
import { vehicleService } from "../services/vehicleService";
import { AuthContext } from "./AuthContext";

const { getAllStations: getAllStationsService, getStationById: getStationByIdService, getAvailableStations: getAvailableStationsService } = stationService;
const { getAllBatteries: getAllBatteriesService, getBatteriesByStationId: getBatteriesByStationIdService, getBatteryById: getBatteryByIdService, updateBatteryById: updateBatteryByIdService } = batteryService;
//Fetch vehicle
const { getVehicleByUserId: getVehicleByUserIdService } = vehicleService;

export const InventoryContext = createContext();

// InventoryProvider: central source for stations, batteries and vehicles
// - Stations: list + availableStations (nearby / filtered for drivers)
// - Batteries: cached batteries used by map and staff views
// - Vehicles: driver's vehicles (used to filter compatible stations)
export const InventoryProvider = ({ children }) => {
    // Get current user from AuthContext (some flows are driver-only)
    const authContext = useContext(AuthContext);
    const user = authContext?.user;

    // ============ STATION STATE (from StationContext) ============
    // `stations` = current list shown in UI (could be all or nearby)
    // `availableStations` = same shape, kept for clarity
    const [stations, setStations] = useState([]);
    const [availableStations, setAvailableStations] = useState([]);
    const [stationLoading, setStationLoading] = useState(false);
    const [stationError, setStationError] = useState(null);
    const [initialized, setInitialized] = useState(false);

    // cached browser geolocation (used to request nearby stations)
    const [userLocation, setUserLocation] = useState(null);

    // ============ BATTERY STATE (from BatteryContext) ============
    // Batteries are loaded for map overlays and staff views
    const [batteries, setBatteries] = useState([]);

    const [batteryLoading, setBatteryLoading] = useState(false);
    const [batteryError, setBatteryError] = useState(null);

    // ============ VEHICLE STATE ============
    // Driver's vehicles used to filter stations by compatibility
    const [vehicles, setVehicles] = useState([]);
    const [vehicleLoading, setVehicleLoading] = useState(false);
    const [vehicleError, setVehicleError] = useState(null);

    // ============ STATION METHODS ============
    // Get user's current location
    const getUserLocation = () => {
        // Return Promise that resolves to {latitude, longitude} or null
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser');
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    console.log('User location obtained:', location);
                    setUserLocation(location);
                    resolve(location);
                },
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    resolve(null);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000 // Cache for 5 minutes
                }
            );
        });
    };

    const fetchAllStations = async () => {
        setStationLoading(true);
        setStationError(null);
        try {
            const data = await getAllStationsService();
            setStations(data);
            setInitialized(true);
            console.log("Stations data fetched successfully", data);
        } catch (error) {
            setStationError(error);
            console.error("Error fetching stations:", error);
        } finally {
            setStationLoading(false);
        }
    };

    const getAvailableStations = async (longitude = null, latitude = null) => {
        setStationLoading(true);
        setStationError(null);

        try {
            // Get user_id from user object
            const userId = user?.user_id || user?.id;

            if (!userId) {
                console.warn('No user_id found, cannot fetch available stations');
                setAvailableStations([]);
                setStations([]);
                return;
            }

            // Lấy vehicleId bất kì từ user (fetch mỗi lần để tránh cache stale)
            let vehicleId = null;
            try {
                const vehiclesResponse = await getVehicleByUserIdService(userId);
                console.log('Vehicles response:', vehiclesResponse);

                // Handle different response formats
                const vehicles = Array.isArray(vehiclesResponse)
                    ? vehiclesResponse
                    : (vehiclesResponse?.data || []);

                // Get first vehicle's ID if exists
                if (vehicles.length > 0) {
                    vehicleId = vehicles[0]?.vehicle_id || vehicles[0]?.id;
                    console.log('Using vehicle_id:', vehicleId);
                    console.log('Vehicle details:', vehicles[0]);
                } else {
                    console.log('No vehicles found for user - will fetch all stations');
                }
            } catch (vehicleError) {
                console.error('Error fetching vehicles:', vehicleError);
                // Continue without vehicle_id - backend will return all stations
            }

            // Get coordinates: use provided > user location > browser geolocation > default HCM
            let finalLongitude = longitude;
            let finalLatitude = latitude;

            if (finalLongitude === null || finalLatitude === null) {
                // Try to use cached user location
                if (userLocation) {
                    finalLongitude = userLocation.longitude;
                    finalLatitude = userLocation.latitude;
                    console.log('Using cached user location');
                } else {
                    // Try to get current location
                    const location = await getUserLocation();
                    if (location) {
                        finalLongitude = location.longitude;
                        finalLatitude = location.latitude;
                        console.log('Using fresh geolocation');
                    } else {
                        // Fallback to HCM coordinates
                        finalLongitude = 106.6297;
                        finalLatitude = 10.8231;
                        console.log('Using default HCM coordinates');
                    }
                }
            }

            // Call API - backend will handle null vehicleId by returning all stations
            console.log('📍 Calling API with params:', {
                userId,
                vehicleId,
                longitude: finalLongitude,
                latitude: finalLatitude
            });

            const data = await getAvailableStationsService(
                userId,
                vehicleId, // null if no vehicle → backend returns all stations
                finalLongitude,
                finalLatitude
            );

            console.log('📦 API Response:', data);

            // Handle response - could be empty array if no stations nearby
            if (Array.isArray(data)) {
                setStations(data);
                setAvailableStations(data);
                setInitialized(true);
                if (data.length === 0) {
                    console.log('✓ No stations found nearby (within 20km radius)');
                } else {
                    console.log(`✓ Found ${data.length} available station(s)`, data);
                }
            } else {
                console.warn('⚠️ Unexpected response format:', data);
                setStations([]);
                setAvailableStations([]);
                setInitialized(true);
            }
        } catch (error) {
            setStationError(error);
            console.error("❌ Error fetching available stations:", error);
            setStations([]);
            setAvailableStations([]); // Set empty on error
        } finally {
            setStationLoading(false);
        }
    }

    const getStationById = async (id) => {
        try {
            const station = await getStationByIdService(id);
            return station;
        } catch (error) {
            console.error("Error fetching station by ID:", error);
            throw error;
        }
    };

    // ============ BATTERY METHODS ============
    const getAllBatteries = async () => {
        setBatteryLoading(true);
        setBatteryError(null);
        try {
            const response = await getAllBatteriesService();

            let batteryPayload = response;

            if (typeof response === 'object' && response !== null) {
                if (Array.isArray(response.data)) {
                    batteryPayload = response.data;
                } else if (Array.isArray(response.data?.data)) {
                    batteryPayload = response.data.data;
                }
            }

            if (!Array.isArray(batteryPayload)) {
                console.warn('BatteryService returned unexpected shape for batteries:', response);
                batteryPayload = [];
            }

            setBatteries(batteryPayload);
        } catch (err) {
            setBatteryError(err instanceof Error ? err.message : String(err));
        } finally {
            setBatteryLoading(false);
        }
    };

    const getAllBatteriesByStationId = async (stationID) => {
        setBatteryLoading(true);
        setBatteryError(null);
        try {
            const batteries = await getBatteriesByStationIdService(stationID);
            setBatteries(batteries);
        } catch (error) {
            setBatteryError(error);
        } finally {
            setBatteryLoading(false);
        }
    };

    const getBatteryById = async (id) => {
        setBatteryLoading(true);
        setBatteryError(null);
        try {
            const battery = await getBatteryByIdService(id);
            return battery;
        } catch (err) {
            setBatteryError(err instanceof Error ? err.message : String(err));
        } finally {
            setBatteryLoading(false);
        }
    };

    const countAvailableBatteriesByStation = (stationId) => {
        if (!stationId || !Array.isArray(batteries)) return 0;

        return batteries.reduce((count, b) => {
            if (!b) return count;
            if (String(b.station_id) === String(stationId) && String((b.status || '')).toLowerCase() === 'full') {
                return count + 1;
            }
            return count;
        }, 0);
    };

    // ============ VEHICLE METHODS ============
    const fetchVehicles = useCallback(async () => {
        const userId = user?.user_id || user?.id;
        if (!userId) {
            console.log('No user_id - cannot fetch vehicles');
            setVehicles([]);
            return;
        }

        setVehicleLoading(true);
        setVehicleError(null);
        try {
            const response = await getVehicleByUserIdService(userId);
            const vehiclesData = Array.isArray(response) ? response : (response?.data || []);
            setVehicles(vehiclesData);
            console.log('✓ Vehicles fetched in context:', vehiclesData);
        } catch (error) {
            setVehicleError(error);
            console.error('❌ Error fetching vehicles in context:', error);
            setVehicles([]);
        } finally {
            setVehicleLoading(false);
        }
    }, [user?.user_id, user?.id]);

    // ============ EFFECTS ============
    // Clear data when user logs out
    useEffect(() => {
        const userId = user?.user_id || user?.id;

        if (!userId) {
            // User logged out - clear everything
            console.log('User logged out - clearing all data');
            setStations([]);
            setInitialized(false);
            setBatteries([]);
            setVehicles([]);
            return;
        }

        // User logged in or changed - reset initialized flag to trigger re-fetch
        console.log('User detected:', userId, '- will fetch fresh data');
        setInitialized(false);

    }, [user?.user_id, user?.id]);

    // Station: Check for token to avoid 401 errors (only for driver role)
    useEffect(() => {
        const checkAndFetch = () => {
            const token = localStorage.getItem('token');

            console.log('InventoryContext mount (stations):', {
                hasToken: !!token,
                hasUser: !!user,
                userId: user?.user_id || user?.id,
                role: user?.role,
                initialized,
                loading: stationLoading,
                stationsCount: stations.length
            });

            if (!token || !user) {
                console.log('No token or user found - cannot fetch stations');
                return;
            }

            // Only fetch available stations for driver role
            if (user.role !== 'driver') {
                console.log(`User role is ${user.role} - skipping available stations fetch (driver only)`);
                return;
            }

            if (!initialized && !stationLoading) {
                console.log('Fetching available stations...');
                getAvailableStations().catch(err => {
                    console.error('Failed to fetch stations:', err);
                });
            }
        };

        checkAndFetch();
        const timer = setTimeout(checkAndFetch, 100);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role, user?.user_id]);

    // Vehicles: Fetch for driver on mount/login
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = user?.user_id || user?.id;

        if (!token || !userId) {
            console.log('No token or user - skipping vehicle fetch');
            return;
        }

        // Only fetch vehicles for driver role
        if (user.role !== 'driver') {
            console.log(`User role is ${user.role} - skipping vehicles fetch (driver only)`);
            return;
        }

        if (!vehicleLoading && vehicles.length === 0) {
            console.log('Fetching vehicles for driver...');
            fetchVehicles();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role, user?.user_id]);

    // Listen for global events so other components/dialogs can trigger a refresh
    useEffect(() => {
        const handler = () => {
            console.log('vehiclesUpdated event received - refreshing vehicles');
            // Only refresh if we have a driver user
            const userId = user?.user_id || user?.id;
            if (!userId || user?.role !== 'driver') return;
            fetchVehicles().catch(err => {
                console.error('Failed to refresh vehicles on vehiclesUpdated', err);
            });
        };

        window.addEventListener('vehiclesUpdated', handler);
        return () => window.removeEventListener('vehiclesUpdated', handler);
    }, [user?.user_id, user?.id, user?.role, fetchVehicles]);

    // Station: Re-fetch when user logs in (only for driver role)
    useEffect(() => {
        const handleLogin = () => {
            if (!initialized && !stationLoading && user && user.role === 'driver') {
                console.log('Driver logged in - fetching available stations');
                getAvailableStations().catch(err => {
                    console.error('Failed to fetch stations after login:', err);
                });
            }
        };

        window.addEventListener('userLoggedIn', handleLogin);
        return () => window.removeEventListener('userLoggedIn', handleLogin);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role, user?.user_id]);

    // Battery: Fetch on mount if logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found - skipping battery fetch on mount');
            return;
        }

        // Only fetch all batteries for admin/driver, not for station_staff
        if (user?.role === 'station_staff') {
            console.log('Station staff - batteries will be fetched by station_id in StaffInventory');
            return;
        }

        getAllBatteries();
    }, [user?.role, user?.user_id]);

    // Combined loading/error for backward compatibility
    const loading = stationLoading || batteryLoading || vehicleLoading;
    const error = stationError || batteryError || vehicleError;

    return (
        <InventoryContext.Provider value={{
            // Station data & methods
            stations,
            availableStations,
            initialized,
            fetchAllStations,
            getStationById,
            getAvailableStations,

            // Battery data & methods
            batteries,
            getAllBatteries,
            getBatteryById,
            getAllBatteriesByStationId,
            countAvailableBatteriesByStation,

            // Vehicle data & methods
            vehicles,
            fetchVehicles,
            vehicleLoading,

            // Combined status
            loading,
            error,

            // Individual status (for advanced use)
            stationLoading,
            stationError,
            batteryLoading,
            batteryError,
        }}>
            {children}
        </InventoryContext.Provider>
    );
};