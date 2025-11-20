// Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    GOOGLE_LOGIN: "/auth/google",
    GOOGLE_CALLBACK: "/auth/google/callback",
    VERIFY_EMAIL: "/auth/verify-email", // GET with ?token=xxx query param
    RESEND_VERIFICATION: "/auth/resend-verification",
    FORGET_PASSWORD: "/auth/forget-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  USER: {
    CREATE_USER: "/users",
    GET_BY_EMAIL: (email) => `/users/email/${email}`,
    GET_ALL_USERS: "/users",
    GET_USER: (id) => `/users/${id}`,
    UPDATE_USER: (id) => `/users/${id}`,
    CHANGE_PASSWORD: "/users/change-password",
    DELETE_USER: (id) => `/users/${id}`,
    GET_PROFILE: "/users/me/profile",
  },

  VEHICLE: {
    CREATE_VEHICLE: "/vehicles",
    GET_ALL_VEHICLES: "/vehicles",
    GET_VEHICLE_BY_VIN: (vin) => `/vehicles/vin/${vin}`,
    GET_VEHICLES_BY_USER: (userId) => `/vehicles/user/${userId}`, // For all roles
    GET_VEHICLE: (id) => `/vehicles/${id}`,
    UPDATE_VEHICLE: (id) => `/vehicles/${id}`,
    ASSIGN_VEHICLE: "/vehicles/add-vehicle",
    REMOVE_VEHICLE: "/vehicles/remove-vehicle",
    DELETE_VEHICLE: (id) => `/vehicles/${id}`,
  },

  STATION: {
    CREATE_STATION: "/stations",
    GET_ALL_STATIONS: "/stations",
    GET_ACTIVE_STATIONS: "/stations/active",
    GET_AVAILABLE_STATIONS: "/stations/available",
    GET_SEARCH_STATIONS: "/stations/search",
    GET_STATION: (id) => `/stations/${id}`,
    UPDATE_STATION: (id) => `/stations/${id}`,
    DELETE_STATION: (id) => `/stations/${id}`,
  },

  BATTERY: {
    CREATE_BATTERY: "/batteries",
    GET_ALL_BATTERIES: "/batteries",
    GET_BEST_BATTERY: "/batteries/best",
    GET_BATTERY: (id) => `/batteries/${id}`,
    GET_BY_STATION: (stationId) => `/batteries/station/${stationId}`,
    DELETE_BATTERY: (id) => `/batteries/${id}`,
    UPDATE_BATTERY: (id) => `/batteries/${id}`,
    UPDATE_BATTERY_CHARGE: `/batteries/set-charge`,
    SIMULATE_CHARGING: `/batteries/simulate-charging`,
  },

  BATTERY_SERVICE_PACKAGE: {
    CREATE_PACKAGE: "/battery-service-packages",
    GET_ALL_PACKAGES: "/battery-service-packages",
    GET_ACTIVE_PACKAGES: "/battery-service-packages/active",
    GET_BY_PRICE_RANGE: "/battery-service-packages/price-range",
    GET_BY_DURATION: (days) => `/battery-service-packages/duration/${days}`,
    GET_BY_NAME: (name) => `/battery-service-packages/name/${name}`,
    GET_PACKAGE_BY_ID: (id) => `/battery-service-packages/${id}`,
    UPDATE_PACKAGE: (id) => `/battery-service-packages/${id}`,
    ACTIVATE_PACKAGE: (id) => `/battery-service-packages/${id}/activate`,
    DEACTIVATE_PACKAGE: (id) => `/battery-service-packages/${id}/deactivate`,
    DELETE_PACKAGE: (id) => `/battery-service-packages/${id}`,
  },

  RESERVATION: {
    CREATE_RESERVATION: "/reservations",
    GET_BY_USER: (userId) => `/reservations/user/${userId}`,
    GET_BY_STATION: (stationId) => `/reservations/station/${stationId}`,
    GET_RESERVATION: (id) => `/reservations/${id}`,
    UPDATE_RESERVATION: (id) => `/reservations/${id}`,
    DELETE_RESERVATION: (id) => `/reservations/${id}`,
  },

  SUBSCRIPTION: {
    CREATE_SUBSCRIPTION: "/subscriptions",
    EXPIRE_SUBSCRIPTIONS: "/subscriptions/expire-subscriptions",
    GET_ALL_SUBSCRIPTIONS: "/subscriptions",
    GET_SUBSCRIPTION: (id) => `/subscriptions/${id}`,
    GET_BY_USER: (userId) => `/subscriptions/user/${userId}`,
    GET_ACTIVE_BY_USER: (userId) => `/subscriptions/user/${userId}/active`,
    UPDATE_SUBSCRIPTION: (id) => `/subscriptions/${id}`,
    CANCEL_SUBSCRIPTION: (id) => `/subscriptions/${id}/cancel`,
    INCREMENT_SWAP: (id) => `/subscriptions/${id}/increment-swap`,
    DELETE_SUBSCRIPTION: (id) => `/subscriptions/${id}`,
  },

  SWAP_TRANSACTION: {
    CREATE_TRANSACTION: "/swap-transactions",
    GET_ALL_TRANSACTIONS: "/swap-transactions",
    GET_BY_USER: (userId) => `/swap-transactions/user/${userId}`,
    GET_BY_STATION: (stationId) => `/swap-transactions/station/${stationId}`,
    GET_TRANSACTION_BY_ID: (id) => `/swap-transactions/transaction/${id}`,
    UPDATE_TRANSACTION: (id) => `/swap-transactions/${id}`,
    DELETE_TRANSACTION: (id) => `/swap-transactions/${id}`,
  },

  PAYMENT: {
    // Basic VNPAY endpoints
    CREATE_VNPAY_URL: "/payments/create-vnpay-url", // Legacy - subscription only - CŨ
    CREATE_VNPAY_URL_ADVANCED: "/payments/create-vnpay-url-advanced", // Multi-type support
    CREATE_VNPAY_URL_WITH_FEES: "/payments/calculate-and-create-vnpay-url", // Integrated calculation - MỚI
    VNPAY_RETURN: "/payments/vnpay-return",
    VNPAY_IPN: "/payments/vnpay-ipn",

    // Payment queries
    GET_PAYMENT: (id) => `/payments/${id}`,
    GET_BY_TXN_REF: (vnpTxnRef) => `/payments/txn/${vnpTxnRef}`,
    GET_PAYMENTS_BY_USER: (userId) => `/payments/user/${userId}`,
    GET_ALL_PAYMENTS: "/payments",
    RENEW_SUBSCRIPTION: "/payments/subscription-renewal",

    // Specialized payment types
    MOCK_PAYMENT: "/payments/mock-payment",
    BATTERY_DEPOSIT: "/payments/battery-deposit",
    DAMAGE_FEE: "/payments/damage-fee",
    BATTERY_REPLACEMENT: "/payments/battery-replacement",
    DIRECT_WITH_FEES: "/payments/direct-with-fees",

    // Fee calculation endpoints
    CALCULATE_SUBSCRIPTION_FEE: "/payments/calculate/subscription-fee",
    CALCULATE_OVERCHARGE_FEE: "/payments/calculate/overcharge-fee",
    CALCULATE_DAMAGE_FEE: "/payments/calculate/damage-fee",
    CALCULATE_COMPLEX_FEE: "/payments/calculate/complex-fee",
  },

  SWAPPING: {
    AUTOMATIC_SWAP: "/swapping/automatic-swap",
    INITIALIZE_BATTERY: "/swapping/initialize-battery",
  },

  SUPPORT: {
    CREATE_SUPPORT: "/supports",
    GET_ALL_SUPPORTS: "/supports",
    GET_STATISTICS: "/supports/statistics",
    GET_BY_USER: (userId) => `/supports/user/${userId}`,
    GET_BY_STATION: (stationId) => `/supports/station/${stationId}`,
    GET_BY_STATUS: (status) => `/supports/status/${status}`,
    GET_SUPPORT: (id) => `/supports/${id}`,
    UPDATE_SUPPORT: (id) => `/supports/${id}`,
    UPDATE_STATUS: (id) => `/supports/${id}/status`,
    UPDATE_RATING: (id) => `/supports/${id}/rating`,
    DELETE_SUPPORT: (id) => `/supports/${id}`,
  },

  BATTERY_TRANSFER_REQUEST: {
    CREATE_REQUEST: "/battery-transfer-request",
    GET_ALL_REQUESTS: "/battery-transfer-request",
    GET_REQUEST: (id) => `/battery-transfer-request/${id}`,
    UPDATE_REQUEST: (id) => `/battery-transfer-request/${id}`,
    DELETE_REQUEST: (id) => `/battery-transfer-request/${id}`,
  },

  BATTERY_TRANSFER_TICKET: {
    CREATE_TICKET: "/battery-transfer-ticket",
    GET_ALL_TICKETS: "/battery-transfer-ticket",
    GET_TICKET: (id) => `/battery-transfer-ticket/${id}`,
    UPDATE_TICKET: (id) => `/battery-transfer-ticket/${id}`,
    DELETE_TICKET: (id) => `/battery-transfer-ticket/${id}`,
    GET_BY_STATION: (stationId) =>
      `/battery-transfer-ticket/station/${stationId}`,
    GET_AVAILABLE_BATTERIES: "/battery-transfer-ticket/available-batteries", // typo từ backend
  },

  CONFIG: {
    CREATE_CONFIG: "/config",
    GET_ALL_CONFIGS: "/config", // Supports ?type=xxx&activeOnly=true query params
    GET_CONFIG: (id) => `/config/${id}`,
    GET_BY_NAME: (name) => `/config/by-name/${name}`,
    GET_VALUE: (name) => `/config/value/${name}`,
    UPDATE_CONFIG: (id) => `/config/${id}`,
    TOGGLE_ACTIVE: (id) => `/config/${id}/toggle`,
    GET_SYSTEM_ALL: "/config/system/all",
    GET_SYSTEM_KEY: (key) => `/config/system/${key}`,
    DELETE_CONFIG: (id) => `/config/${id}`,
  },

  STATISTICS: {
    GET_DASHBOARD: "/admin/statistics/dashboard",
    GET_REVENUE_BY_PACKAGE: "/admin/statistics/revenue/by-package",
    GET_REVENUE_CURRENT_MONTH: "/admin/statistics/revenue/current-month",
    GET_TOP_STATIONS: "/admin/statistics/top-stations", // Supports ?limit=10 query param
    GET_TOP_PACKAGES: "/admin/statistics/top-packages", // Supports ?limit=10 query param
    GET_CANCELLATIONS_CURRENT_MONTH:
      "/admin/statistics/cancellations/current-month",
    GET_SUPPORT_STATS: "/admin/statistics/support-stats",
    GET_BATTERY_TRANSFERS: "/admin/statistics/battery-transfers",
    GET_STATION_STATS: "/admin/statistics/stations",
  },

  ADMIN: {
    GET_DASHBOARD: "/admin/statistics/dashboard",
    GET_REVENUE_BY_PACKAGE: "/admin/statistics/revenue/by-package",
    GET_REVENUE_CURRENT_MONTH: "/admin/statistics/revenue/current-month",
    GET_TOP_STATIONS: "/admin/statistics/top-stations", // Supports ?limit=10 query param
    GET_TOP_PACKAGES: "/admin/statistics/top-packages", // Supports ?limit=10 query param
    GET_CANCELLATIONS_CURRENT_MONTH:
      "/admin/statistics/cancellations/current-month",
    GET_SUPPORT_STATS: "/admin/statistics/support-stats",
    GET_BATTERY_TRANSFERS: "/admin/statistics/battery-transfers",
    GET_STATION_STATS: "/admin/statistics/stations",
  },

  AI: {
    ANALYZE_STATION_UPGRADES: "/ai/analyze-station-upgrades",
  },
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  USER_PROFILE: "/user/profile",

  USER: "/user",
  ADMIN: "/admin",
  GUEST: "/guest",
  STAFF: "/staff",

  // Admin Routes
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_STATISTICS: "/admin/statistics",

  // Pages
  BOOKING: "/booking",
  MAP: "/map",
  PLANS: "/plans",
  SWAP_HISTORY: "/swap-history",
  PAYMENT: "/payment",
  PROFILE: "/profile",
  SUPPORT: "/support",
  VERIFY_EMAIL: "/verify-email",
  FORGET_PASSWORD: "/forget-password",
  RESET_PASSWORD: "/reset-password",

  NOT_FOUND: "/404",
  UNAUTHORIZED: "/unauthorized",
};
