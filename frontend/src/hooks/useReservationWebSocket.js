import { useEffect, useRef } from "react";
import io from "socket.io-client";

/**
 * useReservationWebSocket - Real-time hook for reservation updates via WebSocket
 * Listens to reservation.created events from backend
 * Provides fallback polling if WebSocket not connected
 *
 * @param {Function} onReservationCreated - Callback when new reservation created
 * @param {Boolean} enabled - Enable/disable listening (default: true)
 * @returns {Object} { isConnected, socketId }
 */
export const useReservationWebSocket = (
  onReservationCreated,
  enabled = true
) => {
  const socketRef = useRef(null);
  const listenerRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // Get WebSocket URL from environment or use default
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8080";

    // Connect to /reservations namespace
    const socket = io(`${wsUrl}/reservations`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      query: {
        token: localStorage.getItem("token"),
      },
    });

    // Store socket reference
    socketRef.current = socket;
    setGlobalReservationSocket(socket);

    // Setup event listeners
    socket.on("connect", () => {
      reconnectAttemptsRef.current = 0;
      console.log(`✅ Connected to Reservation WebSocket: ${socket.id}`);

      // Register listener if not already done
      if (!listenerRef.current) {
        socket.on("reservation.created", (data) => {
          console.log("📢 New reservation event received:", data);
          if (onReservationCreated) {
            onReservationCreated(data);
          }
        });
        listenerRef.current = true;
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn(`🔌 Reservation WebSocket disconnected: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.error(`❌ Reservation WebSocket error: ${error.message}`);
      reconnectAttemptsRef.current++;
    });

    socket.on("error", (error) => {
      console.error(`⚠️ Reservation WebSocket error: ${error}`);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off("reservation.created");
        socketRef.current.disconnect();
        socketRef.current = null;
        listenerRef.current = false;
      }
    };
  }, [enabled, onReservationCreated]);

  return {
    isConnected: socketRef.current?.connected || false,
    socketId: socketRef.current?.id || null,
  };
};

/**
 * Singleton reference for WebSocket status hook
 */
let globalSocketRef = null;

export const setGlobalReservationSocket = (socket) => {
  globalSocketRef = socket;
};

/**
 * Hook to get reservation WebSocket connection status
 * Useful for displaying connection indicator in UI
 *
 * @returns {Object} { isConnected, socketId }
 */
export const useReservationWebSocketStatus = () => {
  return {
    isConnected: globalSocketRef?.connected || false,
    socketId: globalSocketRef?.id || null,
  };
};
