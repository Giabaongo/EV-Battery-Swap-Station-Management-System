import api from "./api";
import { API_ENDPOINTS } from "../constants";

//Add a new support ticket
const createSupportTicket = async (ticketData) => {
  try {
    const response = await api.post(API_ENDPOINTS.SUPPORT.CREATE_SUPPORT, ticketData);
    return response.data;
  } catch (error) {
    console.error("Error creating support ticket:", error);
    throw error;
  }
};

// Get all support tickets
const getAllSupports = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.SUPPORT.GET_ALL_SUPPORTS);
    return response.data;
  } catch (error) {
    console.error("Error fetching all support tickets:", error);
    throw error;
  }
};

// Get support by ID
const getSupportById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUPPORT.GET_SUPPORT(id));
    return response.data;
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    throw error;
  }
};

// Get supports by status
const getSupportsByStatus = async (status) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUPPORT.GET_BY_STATUS(status));
    return response.data;
  } catch (error) {
    console.error("Error fetching supports by status:", error);
    throw error;
  }
};

// Update support ticket
const updateSupport = async (id, updateData) => {
  try {
    const response = await api.patch(API_ENDPOINTS.SUPPORT.UPDATE_SUPPORT(id), updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating support ticket:", error);
    throw error;
  }
};

// Update support status
const updateSupportStatus = async (id, status) => {
  try {
    const response = await api.patch(API_ENDPOINTS.SUPPORT.UPDATE_SUPPORT(id) + '/status', { status });
    return response.data;
  } catch (error) {
    console.error("Error updating support status:", error);
    throw error;
  }
};

// Delete support ticket
const deleteSupport = async (id) => {
  try {
    const response = await api.delete(API_ENDPOINTS.SUPPORT.UPDATE_SUPPORT(id));
    return response.data;
  } catch (error) {
    console.error("Error deleting support ticket:", error);
    throw error;
  }
};

const clearSupportTicket = async (id) => {
  try {
    const response = await api.patch(API_ENDPOINTS.SUPPORT.CLOSE_TICKET(id), {
      status: "closed"
    });
    return response.data;
  } catch (error) {
    console.error("Error clearing support ticket:", error);
    throw error;
  }
};

export const supportService = {
  createSupportTicket,
  getAllSupports,
  getSupportById,
  getSupportsByStatus,
  updateSupport,
  updateSupportStatus,
  deleteSupport,
  clearSupportTicket,
};

export default supportService;
