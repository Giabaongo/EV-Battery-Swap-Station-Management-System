import api from "./api";
import { API_ENDPOINTS } from "../constants";

const createSwapTransaction = async (swapData) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.SWAP_TRANSACTION.CREATE_TRANSACTION,
      swapData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating swap history:", error);
    throw error;
  }
};

const getSwapTransactionById = async (transactionId) => {
  try {
    const response = await api.get(
      `${API_ENDPOINTS.SWAP_TRANSACTION.GET_TRANSACTION}/${transactionId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching swap transaction:", error);
    throw error;
  }
};

const updateSwapTransaction = async (transactionId, updateData) => {
  try {
    const response = await api.patch(
      `${API_ENDPOINTS.SWAP_TRANSACTION.UPDATE_TRANSACTION}/${transactionId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating swap transaction:", error);
    throw error;
  }
};

const getAllSwapTransactions = async () => {
  try {
    const response = await api.get(
      API_ENDPOINTS.SWAP_TRANSACTION.GET_ALL_TRANSACTIONS
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching swap histories:", error);
    throw error;
  }
};

const getAllSwapTransactionsByUserId = async (userId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.SWAP_TRANSACTION.GET_BY_USER(userId)
    );
    console.log("Fetched swap histories by user ID:", response);
    return response.data;
  } catch (error) {
    console.error("Error fetching swap histories by userId:", error);
    throw error;
  }
};

const getAllSwapTransactionsByStationId = async (stationId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.SWAP_TRANSACTION.GET_BY_STATION(stationId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching swap histories by stationId:", error);
    throw error;
  }
};

export const swapService = {
  getSwapTransactionById,
  updateSwapTransaction,
  createSwapTransaction,
  getAllSwapTransactionsByStationId,
  getAllSwapTransactions,
  getAllSwapTransactionsByUserId,
  // getSwapTransactionsByStation,
};
