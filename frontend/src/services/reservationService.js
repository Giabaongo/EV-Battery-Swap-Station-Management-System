import api from "./api";
import { API_ENDPOINTS } from "../constants";

//Function to get all reservations by station ID
const getReservationsByStationId = async (stationId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.RESERVATION.GET_BY_STATION(stationId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching reservations:", error);
    throw error;
  }
};

// Function to create a new reservation
const createReservation = async (reservationData) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.RESERVATION.CREATE_RESERVATION,
      reservationData
    );
    // Backend returns { reservation, battery } – normalize to reservation entity for consumers
    return response.data?.reservation || response.data;
  } catch (error) {
    console.error("Error creating reservation:", error);
    throw error;
  }
};

// Function to get reservation by ID (not user_id - use proper endpoint)
const getReservationById = async (id) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.RESERVATION.GET_RESERVATION(id)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching reservation by ID:", error);
    throw error;
  }
};

// Function to update reservation status
const updateReservationStatus = async (reservationId, userId, status) => {
  try {
    const response = await api.patch(
      API_ENDPOINTS.RESERVATION.UPDATE_RESERVATION(reservationId),
      { user_id: Number(userId), status }
    );
    return response.data;
  } catch (error) {
    const msg =
      error?.response?.data?.message || error?.message || "Unknown error";
    console.error(
      "Error updating reservation status:",
      msg,
      error?.response?.data || ""
    );
    throw error;
  }
};

// Function to get reservations by user ID
const getReservationsByUserId = async (userId, options = {}) => {
  try {
    const { signal } = options;
    const response = await api.get(
      API_ENDPOINTS.RESERVATION.GET_BY_USER(userId),
      { signal }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    throw error;
  }
};

// Function to get scheduled reservations (status = "scheduled")
const getScheduledReservations = async () => {
  try {
    const response = await api.get(
      API_ENDPOINTS.RESERVATION.GET_ALL_RESERVATIONS
    );
    const allReservations = response.data;
    // Filter only scheduled reservations
    return allReservations.filter((res) => res.status === "scheduled");
  } catch (error) {
    console.error("Error fetching scheduled reservations:", error);
    throw error;
  }
};

//Export các hàm dịch vụ
export const reservationService = {
  getReservationsByStationId,
  createReservation,
  getReservationById,
  updateReservationStatus,
  getReservationsByUserId,
  getScheduledReservations,
};
