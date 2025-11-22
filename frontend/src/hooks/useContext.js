import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { InventoryContext } from "../contexts/InventoryContext";
import { ServiceContext } from "../contexts/ServiceContext";
import { BookingContext } from "../contexts/BookingContext";
import { VehicleContext } from "../contexts/VehicleContext";

export function useAuth() {
  return useContext(AuthContext);
}

// ============ STATION (from InventoryContext) ============
export function useStation() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useStation must be used within InventoryProvider");
  }

  return {
    stations: context.stations,
    availableStations: context.availableStations,
    initialized: context.initialized,
    // Backwards compatible alias: expose fetchAllStations as getAllStations
    getAllStations: context.fetchAllStations || context.getAllStations,
    // Primary method to get nearby/available stations
    getAvailableStations: context.getAvailableStations,
    getStationById: context.getStationById,
    loading: context.stationLoading,
    error: context.stationError,
  };
}

// ============ VEHICLE (from InventoryContext) ============
export function useVehicle() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useVehicle must be used within InventoryProvider");
  }

  return {
    vehicles: context.vehicles,
    fetchVehicles: context.fetchVehicles,
    loading: context.vehicleLoading,
  };
}

// ============ BATTERY (from InventoryContext) ============
export function useBattery() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useBattery must be used within InventoryProvider");
  }

  return {
    batteries: context.batteries,
    getAllBatteries: context.getAllBatteries,
    getAllBatteriesByStationId: context.getAllBatteriesByStationId,
    getBatteryById: context.getBatteryById,
    countAvailableBatteriesByStation: context.countAvailableBatteriesByStation,
    loading: context.batteryLoading,
    error: context.batteryError,
  };
}

// ============ RESERVATION (from BookingContext) ============
export function useReservation() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useReservation must be used within BookingProvider");
  }

  return {
    reservations: context.reservations,
    activeReservation: context.activeReservation,
    createReservation: context.createReservation,
    getAllReservationsByStationId: context.getAllReservationsByStationId,
    getReservationById: context.getReservationById,
    getReservationsByUserId: context.getReservationsByUserId,
    updateReservationStatus: context.updateReservationStatus,
    clearActiveReservation: context.clearActiveReservation,
    loading: context.reservationLoading,
    error: context.reservationError,
  };
}

// ============ PACKAGE (from ServiceContext) ============
export function usePackage() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("usePackage must be used within ServiceProvider");
  }

  return {
    packages: context.packages,
    getAllPackages: context.getAllPackages,
    getPackageById: context.getPackageById,
    loading: context.packageLoading,
    error: context.packageError,
  };
}

// ============ SUBSCRIPTION (from ServiceContext) ============
export function useSubscription() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useSubscription must be used within ServiceProvider");
  }

  return {
    subscriptions: context.subscriptions,
    activeSubscription: context.activeSubscription,
    fetchAllSubscriptions: context.fetchAllSubscriptions,
    getSubscriptionById: context.getSubscriptionById,
    getSubscriptionsByUserId: context.getSubscriptionsByUserId,
    getActiveSubscription: context.getActiveSubscription,
    createSubscription: context.createSubscription,
    updateSubscription: context.updateSubscription,
    cancelSubscription: context.cancelSubscription,
    checkExpiredSubscriptions: context.checkExpiredSubscriptions,
    incrementSwapCount: context.incrementSwapCount,
    loading: context.subscriptionLoading,
    error: context.subscriptionError,
  };
}

// ============ SWAP REQUEST (from BookingContext) ============
export function useSwapRequest() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useSwapRequest must be used within BookingProvider");
  }

  return {
    swapRequests: context.swapRequests,
    fetchSwapRequestsForStation: context.fetchSwapRequestsForStation,
    getPendingRequestsForStaff: context.getPendingRequestsForStaff,
    updateRequestStatus: context.updateRequestStatus,
    notifications: context.notifications,
    addNotification: context.addNotification,
    getNotificationsForUser: context.getNotificationsForUser,
    markAsRead: context.markAsRead,
    loading: context.swapRequestLoading,
    error: context.swapRequestError,
  };
}
