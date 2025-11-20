import api from "./api";
import { API_ENDPOINTS } from "../constants";

const swapBatteries = async (payload) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.SWAPPING.AUTOMATIC_SWAP,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error calling automatic swap:", error);
    throw error;
  }
};

const initializeBattery = async (payload) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.SWAPPING.INITIALIZE_BATTERY,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error calling initialize battery:", error);
    throw error;
  }
};

// Get empty slot for returning battery
const getEmptySlot = async (data) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.SWAPPING.GET_EMPTY_SLOT,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error getting empty slot:", error);
    throw error;
  }
};

// Return battery to cabinet slot
const returnBattery = async (data) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.SWAPPING.RETURN_BATTERY,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error returning battery:", error);
    throw error;
  }
};

// Get full slot for taking battery
const getFullSlot = async (data) => {
  try {
    const response = await api.post(API_ENDPOINTS.SWAPPING.GET_FULL_SLOT, data);
    return response.data;
  } catch (error) {
    console.error("Error getting full slot:", error);
    throw error;
  }
};

// Take battery from cabinet
const takeBattery = async (data) => {
  try {
    const response = await api.post(API_ENDPOINTS.SWAPPING.TAKE_BATTERY, data);
    return response.data;
  } catch (error) {
    console.error("Error taking battery:", error);
    throw error;
  }
};

export const swappingService = {
  swapBatteries,
  initializeBattery,
  getEmptySlot,
  returnBattery,
  getFullSlot,
  takeBattery,
};
