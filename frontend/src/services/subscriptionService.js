import api from "./api";
import { API_ENDPOINTS } from "../constants";

// Get all subscriptions
const getAllSubscriptions = async () => {
  try {
    const response = await api.get(
      API_ENDPOINTS.SUBSCRIPTION.GET_ALL_SUBSCRIPTIONS
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all subscriptions:", error);
    throw error;
  }
};

// Get subscription by ID
const getSubscriptionById = async (id) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.SUBSCRIPTION.GET_SUBSCRIPTION(id)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription by ID:", error);
    throw error;
  }
};

// Get subscriptions by user ID
const getSubscriptionsByUserId = async (userId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.SUBSCRIPTION.GET_BY_USER(userId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching subscriptions by user ID:", error);
    throw error;
  }
};

// Get active subscription by user ID
const getActiveSubscriptionByUserId = async (userId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.SUBSCRIPTION.GET_ACTIVE_BY_USER(userId)
    );
    // Backend returns array, get first active subscription
    const subscriptions = response.data;
    if (Array.isArray(subscriptions) && subscriptions.length > 0) {
      return subscriptions[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching active subscription by user ID:", error);
    throw error;
  }
};

// Create subscription
const createSubscription = async (subscriptionData) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.SUBSCRIPTION.CREATE_SUBSCRIPTION,
      subscriptionData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
};

// Update subscription
const updateSubscription = async (id, subscriptionData) => {
  try {
    const response = await api.patch(
      API_ENDPOINTS.SUBSCRIPTION.UPDATE_SUBSCRIPTION(id),
      subscriptionData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
};

// Cancel subscription
const cancelSubscription = async (id) => {
  try {
    const response = await api.patch(
      API_ENDPOINTS.SUBSCRIPTION.CANCEL_SUBSCRIPTION(id)
    );
    return response.data;
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw error;
  }
};

// Check expired subscriptions
const checkExpiredSubscriptions = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBSCRIPTION.CHECK_EXPIRED);
    return response.data;
  } catch (error) {
    console.error("Error checking expired subscriptions:", error);
    throw error;
  }
};

// Increment swap count
const incrementSwapCount = async (id) => {
  try {
    const response = await api.patch(
      API_ENDPOINTS.SUBSCRIPTION.INCREMENT_SWAP(id)
    );
    return response.data;
  } catch (error) {
    console.error("Error incrementing swap count:", error);
    throw error;
  }
};

export const subscriptionService = {
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionsByUserId,
  getActiveSubscriptionByUserId,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  checkExpiredSubscriptions,
  incrementSwapCount,
};
