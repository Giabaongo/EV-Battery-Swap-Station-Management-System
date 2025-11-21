import api from "./api";
import { API_ENDPOINTS } from "../constants";

const getAllPackages = async () => {
  try {
    const response = await api.get(
      API_ENDPOINTS.BATTERY_SERVICE_PACKAGE.GET_ALL_PACKAGES
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all packages:", error);
    throw error;
  }
};

const getPackageById = async (packageId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.BATTERY_SERVICE_PACKAGE.GET_PACKAGE_BY_ID(packageId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching package by ID:", error);
    throw error;
  }
};

const createPackage = async (packageData) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.BATTERY_SERVICE_PACKAGE.CREATE_PACKAGE,
      packageData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating package:", error);
    throw error;
  }
};


const deletePackage = async (packageId) => {
  try {
    const response = await api.delete(
      API_ENDPOINTS.BATTERY_SERVICE_PACKAGE.DELETE_PACKAGE(packageId)
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting package:", error);
    throw error;
  }
};

const updatePackage = async (packageId, packageData) => {
  try {
    const response = await api.patch(
      API_ENDPOINTS.BATTERY_SERVICE_PACKAGE.UPDATE_PACKAGE(packageId),
      packageData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating package:", error);
    throw error;
  }
};

export const packageService = {
  getAllPackages,
  getPackageById,
  createPackage,
  deletePackage,
  updatePackage,
};
