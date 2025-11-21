import api from "./api";
import { API_ENDPOINTS } from "../constants";

const getAllStatistics = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS.GET_DASHBOARD);
    return response.data;
  } catch (error) {
    console.error("Error fetching all statistics:", error);
    throw error;
  }
};

const getRevenueByPackage = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS.GET_REVENUE_BY_PACKAGE);
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue by package:", error);
    throw error;
  }
};

const getCurrentMonthRevenue = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS.GET_REVENUE_CURRENT_MONTH);
    return response.data;
  } catch (error) {
    console.error("Error fetching current month revenue:", error);
    throw error;
  }
};

const getTopStations = async (limit = 10) => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS.GET_TOP_STATIONS, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching top stations:", error);
    throw error;
  }
};

const getTopPackages = async (limit = 10) => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS.GET_TOP_PACKAGES, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching top packages:", error);
    throw error;
  }
};

const getCancellations = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS.GET_CANCELLATIONS_CURRENT_MONTH);
    return response.data;
  } catch (error) {
    console.error("Error fetching cancellations:", error);
    throw error;
  }
};

const getSupportStats = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS.GET_SUPPORT_STATS);
    return response.data;
  } catch (error) {
    console.error("Error fetching support stats:", error);
    throw error;
  }
};

const getBatteryTransfers = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS.GET_BATTERY_TRANSFERS);
    return response.data;
  } catch (error) {
    console.error("Error fetching battery transfers:", error);
    throw error;
  }
};

const getStationStats = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS.GET_STATION_STATS);
    return response.data;
  } catch (error) {
    console.error("Error fetching station stats:", error);
    throw error;
  }
};

export const statisticService = {
  getAllStatistics,
  getRevenueByPackage,
  getCurrentMonthRevenue,
  getTopStations,
  getTopPackages,
  getCancellations,
  getSupportStats,
  getBatteryTransfers,
  getStationStats,
};