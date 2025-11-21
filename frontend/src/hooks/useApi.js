// hooks/useApi.js
import { useAuth } from "./useContext";
import api from "../services/api";

export const useApi = () => {
  const { token } = useAuth();

  const callApi = async (method, url, data = null, config = {}) => {
    try {
      const response = await api({
        method,
        url,
        data,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          ...config.headers,
        },
        ...config,
      });
      return response.data;
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  };

  return { callApi };
};
