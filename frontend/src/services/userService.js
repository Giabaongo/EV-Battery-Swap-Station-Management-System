import api from "./api";
import { API_ENDPOINTS } from "../constants";

  const getUserByEmail = async (email) => {
    try {
      const response = await api.get(API_ENDPOINTS.USER.GET_BY_EMAIL(email));
      return response.data;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw error;
    }
  }

  const getUserById = async (userId) => {
    try {
      const response = await api.get(API_ENDPOINTS.USER.GET_USER(userId));
      return response.data;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }
  }

  const getAllUsers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.USER.GET_ALL_USERS);
      return response.data;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  }

  const updateUser = async (userId, userData) => {
    try {
      const response = await api.patch(API_ENDPOINTS.USER.UPDATE_USER(userId), userData);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }   
  }

  const createUser = async (userData) => {
    try {
      const response = await api.post(API_ENDPOINTS.USER.CREATE_USER, userData);      
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }       
  }

  const deleteUser = async (userId) => {
    try {
      const response = await api.delete(API_ENDPOINTS.USER.DELETE_USER(userId));
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

export const userService = {
  getUserByEmail,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  createUser
};

export default userService;