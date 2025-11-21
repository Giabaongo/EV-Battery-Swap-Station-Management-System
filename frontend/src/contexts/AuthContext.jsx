// Auth context - Simplified
import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { authService } from "../services/authService";
import { redirect, useNavigate } from "react-router-dom";

const {
    login: loginService,
    redirectToGoogleLogin: redirectToGoogleLoginService,
    handleGoogleCallback: handleGoogleCallbackService,
    logout: logoutService,
    register: registerService,
    createStaffAccount: createStaffAccountService,
    getAllUsers: getAllUsersService
} = authService;

export const AuthContext = createContext();

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);

    const isAuthenticated = !!user;

    // Helper function để format error message
    const formatErrorMessage = (error) => {
        if (!error) return null;

        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message;

            if (status === 401 || status === 400) {
                return "Email or username or password is invalid";
            }
            if (status === 409) {
                return "Email or phone number has been used";
            }
            if (status === 403) {
                return "You do not have permission to perform this action";
            }

            return message || "An error occurred. Please try again";
        }

        if (error.request) {
            return "Unable to connect to the server. Please check your network connection";
        }

        return error.message || "An unknown error occurred";
    };

    // Function to handle login
    const login = async (credentials) => {
        setLoading(true);
        setError(null);

        try {
            // Login to get token
            const response = await loginService(credentials);
            console.log('Login response:', response);

            setToken(response.accessToken);
            localStorage.setItem("token", response.accessToken);
            localStorage.setItem("refreshToken", response.refreshToken);

            // Fetch user profile with token
            const userData = await authService.getProfile();
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));

            // Dispatch custom event to notify other contexts that login succeeded
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));

            // Navigate dựa vào role
            if (userData.role === "admin") {
                navigate("/admin");
            } else if (userData.role === "station_staff") {
                navigate("/staff");
            } else {
                navigate("/driver");
            }

            return userData;
        } catch (err) {
            // Format and store error for UI, but don't throw to avoid unhandled promise rejections
            const errorMessage = formatErrorMessage(err);
            setError(errorMessage);
            // Return null to indicate login failure. Callers should check the return value.
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Function to handle Google login
    const redirectToGoogleLogin = async () => {
        try {
            await redirectToGoogleLoginService();
        } catch (error) {
            setError("Đăng nhập với Google thất bại. Vui lòng thử lại.");
            console.error("Login with Google error:", error);
        }
    }

    // Function to handle Google login callback
    const handleGoogleCallback = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await handleGoogleCallbackService();
            console.log('Google callback response:', response);

            setToken(response.accessToken);
            localStorage.setItem("token", response.accessToken);

            // Fetch user profile with token
            const userData = await authService.getProfile();
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));

            // Navigate based on role
            if (userData.role === "admin") {
                navigate("/admin");
            } else if (userData.role === "station_staff") {
                navigate("/staff");
            } else {
                navigate("/driver");
            }
        } catch (error) {
            setError("Đăng nhập với Google thất bại. Vui lòng thử lại.");
            console.error("Login with Google error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Function to handle logout
    const logout = async () => {
        try {
            await logoutService();
        } catch (error) {
            console.error("Logout error:", error);
        }
        setUser(null);
        setToken(null);
        setError(null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
    };

    // Function to handle register
    const register = async (userInfo) => {
        setLoading(true);
        setError(null);

        try {
            const response = await registerService(userInfo);
            console.log('Register response:', response);

            if (response?.accessToken) {
                const tokenPayload = JSON.parse(atob(response.accessToken.split('.')[1]));

                const userData = {
                    id: tokenPayload.sub,
                    name: tokenPayload.username,
                    email: tokenPayload.email,
                    phone: tokenPayload.phone,
                    role: tokenPayload.role,
                    station_id: tokenPayload.station_id || tokenPayload.stationId || null
                };

                setUser(userData);
                setToken(response.accessToken);

                localStorage.setItem("token", response.accessToken);
                localStorage.setItem("refreshToken", response.refreshToken);
                localStorage.setItem("user", JSON.stringify(userData));

                // Navigate to login after 1 second
                setTimeout(() => navigate("/login"), 1000);

                return userData;
            } else {
                setTimeout(() => navigate("/login"), 1000);
                return { success: true, message: 'Registration successful' };
            }
        } catch (err) {
            // Format and store error for UI; return null so callers can handle gracefully.
            const errorMessage = formatErrorMessage(err);
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Function to create staff account
    const createStaffAccount = async (staffInfo) => {
        setLoading(true);
        setError(null);

        try {
            const response = await createStaffAccountService(staffInfo);
            console.log('Create staff account response:', response);
            return response;
        } catch (err) {
            const errorMessage = formatErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Function to get all users
    const getAllUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getAllUsersService();
            return response;
        } catch (err) {
            const errorMessage = formatErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Clear error function (stable reference)
    const clearError = useCallback(() => setError(null), []);

    // Check user on page reload - fetch from API using token
    useEffect(() => {
        const initializeUser = async () => {
            const savedToken = localStorage.getItem("token");

            // If no token, user is not logged in
            if (!savedToken) {
                setUser(null);
                return;
            }

            // If token exists, fetch user profile from API
            try {
                setLoading(true);
                const userData = await authService.getProfile();

                // Normalize user data: ensure 'id' field exists
                if (!userData.id && userData.user_id) {
                    userData.id = userData.user_id;
                }

                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));

                // Dispatch event for other contexts
                window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));
            } catch (err) {
                console.error("Failed to fetch user profile on app load:", err);
                // If API call fails (e.g., token expired), clear auth state
                setUser(null);
                setToken(null);
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
            } finally {
                setLoading(false);
            }
        };

        initializeUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                error,
                isAuthenticated,
                login,
                redirectToGoogleLogin,
                handleGoogleCallback,
                logout,
                register,
                createStaffAccount,
                getAllUsers,
                clearError,
                setUser,
                setToken
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};