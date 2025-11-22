// API service
import api from "./api";
import { API_ENDPOINTS } from "../constants";

const getAllConfigs = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.CONFIG.GET_ALL_CONFIGS);
    console.log("Config API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching configurations:", error);
    console.error("Error details:", error.response?.data);
    throw error;
  }
}

const getConfigById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.CONFIG.GET_CONFIG(id));
    return response.data;
  } catch (error) {
    console.error("Error fetching config:", error);
    throw error;
  }
}

const updateConfig = async (id, data) => {
  try {
    const response = await api.patch(API_ENDPOINTS.CONFIG.UPDATE_CONFIG(id), data);
    return response.data;
  } catch (error) {
    console.error("Error updating config:", error);
    throw error;
  }
}

export const configService = {
  getAllConfigs,
  getConfigById,
  updateConfig
}