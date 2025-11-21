// Auth service
import api from "./api";
import { API_ENDPOINTS } from "../constants";

//Login function
const login = async (credentials) => {
  // Let callers handle errors (they can format and display messages as needed).
  const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  return response.data;
};

// Login with Google function
const redirectToGoogleLogin = () => {
  // Construct full backend URL for Google OAuth
  const backendUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
  const googleAuthUrl = `${backendUrl}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`;

  console.log("Redirecting to Google OAuth:", googleAuthUrl);
  window.location.href = googleAuthUrl;
};

// Function to handle Google login callback
const handleGoogleCallback = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.AUTH.GOOGLE_CALLBACK);
    return response.data;
  } catch (error) {
    console.error("Login with Google error:", error);
    throw error;
  }
};

//Logout function
const logout = async () => {
  try {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true };
  } catch (error) {
    // Vẫn clear localStorage dù API lỗi
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("Logout error:", error);
    return { success: true };
  }
};

//Register function
const register = async (userInfo) => {
  // Let callers handle errors and decide what to display; avoid noisy logs here.
  const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userInfo);
  return response.data;
};

//Create account for staff
const createStaffAccount = async (staffInfo) => {
  const normalizePhone = (phone) => {
    if (!phone) return phone;
    let normalized = phone.toString().replace(/\D/g, "");
    if (normalized.startsWith("84")) normalized = "0" + normalized.slice(2);
    return normalized;
  };

  const payload = {
    ...staffInfo,
    phone: normalizePhone(staffInfo.phone),
    email: staffInfo.email.trim().toLowerCase(),
    username: staffInfo.username.trim(),
  };

  // Debug: log payload to help trace server 400 validation
  console.log("createStaffAccount payload:", payload);

  const token = localStorage.getItem("token");
  const res = await api.post(API_ENDPOINTS.USER.USERS, payload, {
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
  });
  return res.data;
};

//update user profile
const updateProfile = async (profileData) => {
  try {
    const response = await api.patch(
      API_ENDPOINTS.USER.UPDATE_USER,
      profileData
    );
    return response.data;
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};

//get current user profile
const getProfile = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USER.GET_PROFILE);
    return response.data;
  } catch (error) {
    console.error("Get profile error:", error);
    if (error.response) console.log(error.response.data, error.response.status);
    else if (error.request) console.log(error.request);
    else console.log(error.message);
    throw error;
  }
};

//Get all users
const getAllUsers = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USER.USERS);
    return response.data;
  } catch (error) {
    console.error("Get all users error:", error);
    throw error;
  }
};

// Delete user by ID
const deleteUser = async (userId) => {
  try {
    const response = await api.delete(
      `${API_ENDPOINTS.USER.DELETE_USER}/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Delete user error:", error);
    throw error;
  }
};

const verifyEmail = async (token) => {
  try {
    const response = await api.get(
      `${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${token}`
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying email:", error);
    throw error;
  }
};

//Change password function
const changePassword = async (passwordData) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      passwordData
    );
    return response.data;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

// Forget password function - request password reset email
const forgetPassword = async (email) => {
  try {
    const response = await api.post(API_ENDPOINTS.AUTH.FORGET_PASSWORD, {
      email,
    });
    return response.data;
  } catch (error) {
    console.error("Error requesting password reset:", error);
    throw error;
  }
};

// Reset password function - set new password with token
const resetPassword = async ({ token, new_password }) => {
  try {
    const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      new_password,
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};

// Legacy authService object for backward compatibility
export const authService = {
  login,
  redirectToGoogleLogin,
  handleGoogleCallback,
  logout,
  register,
  getProfile,
  getAllUsers,
  updateProfile,
  deleteUser,
  createStaffAccount,
  verifyEmail,
  changePassword,
  forgetPassword,
  resetPassword,
};
