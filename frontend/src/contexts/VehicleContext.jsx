import { createContext, useState, useEffect, useContext } from "react";
//import service tùy theo dịch vụ
import { vehicleService } from "../services/vehicleService";
import { AuthContext } from "./AuthContext";

const { getAllVehicles: getAllVehiclesService,
    getVehicleById: getVehicleByIdService,
    getVehicleByVin: getVehicleByVinService,
    getVehicleByUserId: getVehicleByUserIdService
} = vehicleService;

export const VehicleContext = createContext();

export const VehicleProvider = ({ children }) => {
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    //function to fetch all vehicles (for current user)
    const fetchAllVehicles = async (userId = null) => {
        // Use parameter if provided, otherwise fall back to context user
        const targetUserId = userId || user?.user_id;
        
        if (!targetUserId) {
            console.warn('No user logged in, skipping vehicle fetch');
            setVehicles([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await getVehicleByUserIdService(targetUserId);
            // Handle different response structures
            const vehiclesData = response?.data || response || [];
            setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        } catch (err) {
            setError(err.message);
            setVehicles([]);
        } finally {
            setLoading(false);
        }
    };

    

    //function to fetch vehicle by VIN
    const fetchVehicleByVin = async (vin) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getVehicleByVinService(vin);
            setVehicles([response.data]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's vehicles when user changes
    useEffect(() => {
        if (user?.user_id) {
            fetchAllVehicles();
        } else {
            setVehicles([]);
        }
    }, [user?.user_id]);

    return (
        <VehicleContext.Provider value={{ vehicles, loading, error, fetchAllVehicles, fetchVehicleByVin }}>
            {children}
        </VehicleContext.Provider>
    );
};
