import api from "./api";
import { API_ENDPOINTS } from "../constants";

/**
 * AIService - Handles all AI-related API calls
 */
const aiService = {
  /**
   * Analyze stations for upgrade recommendations
   * @returns {Promise<Object>} Analysis result with recommendations
   */
  analyzeStationUpgrades: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.AI.ANALYZE_STATION_UPGRADES);
      return response.data;
    } catch (error) {
      console.error("Error analyzing station upgrades:", error);
      throw error;
    }
  },
};

export default aiService;
