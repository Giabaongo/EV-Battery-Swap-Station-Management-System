import api from "./api";
import { API_ENDPOINTS } from "../constants";

// Get all stations function
const getAllStations = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATION.GET_ALL_STATIONS);
    return response.data;
  } catch (error) {
    console.error("Error fetching all stations:", error);
    throw error;
  }
};

const getAvailableStations = async (
  userId,
  vehicleId = null,
  longitude = null,
  latitude = null
) => {
  try {
    if (!userId) {
      throw new Error("user_id is required to fetch available stations");
    }

    // Validate coordinates - they should be provided by caller
    if (longitude === null || latitude === null) {
      throw new Error("Coordinates (longitude, latitude) are required");
    }

    // Prepare request body with all parameters
    const body = {
      user_id: parseInt(userId),
      latitude,
      longitude,
    };

    if (vehicleId) {
      body.vehicle_id = parseInt(vehicleId);
    }

    console.log("Calling getAvailableStations with body:", body);

    const response = await api.post(
      API_ENDPOINTS.STATION.GET_AVAILABLE_STATIONS,
      body
    );

    console.log("getAvailableStations response:", response.data);
    return response.data;
  } catch (error) {
    // Handle 404 as "no stations found nearby" - not a hard error
    if (error.response?.status === 404) {
      const message =
        error.response?.data?.message || "No available stations found";
      console.warn("⚠️ No stations found:", message);
      console.log(
        "This usually means no stations within 20km radius or no compatible batteries"
      );
      return []; // Return empty array instead of throwing
    }

    // For other errors, log details and throw
    console.error("Error fetching available stations:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error details:", {
      message: error.message,
      backendMessage: error.response?.data?.message,
      backendError: error.response?.data?.error,
      validationErrors: error.response?.data?.errors,
      status: error.response?.status,
      userId,
      vehicleId,
    });
    throw error;
  }
};

//Get station by ID function
const getStationById = async (id) => {
  try {
    // GET_STATION is a function that returns the path
    const response = await api.get(API_ENDPOINTS.STATION.GET_STATION(id));
    return response.data;
  } catch (error) {
    console.error("Error fetching station by ID:", error);
    throw error;
  }
};

const createStation = async (stationData) => {
  try {
    const response = await api.post(API_ENDPOINTS.STATION.CREATE_STATION, stationData);  
    return response.data; 
  } catch (error) {
    console.error("Error creating station:", error);
    throw error;
  } 
};

const updateStation = async (id, stationData) => {
  try {
    // console.log('Updating station with ID:', id);
    // console.log('Station data being sent:', stationData);
    // console.log('API endpoint:', API_ENDPOINTS.STATION.UPDATE_STATION(id));
    
    const response = await api.patch(API_ENDPOINTS.STATION.UPDATE_STATION(id), stationData);
    return response.data;
  } catch (error) {
    console.error("Error updating station:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error response status:", error.response?.status);
    console.error("Error response headers:", error.response?.headers);
    throw error;
  }
};

export const stationService = {
  getAllStations,
  getStationById,
  getAvailableStations,
  createStation,
  updateStation,
};
