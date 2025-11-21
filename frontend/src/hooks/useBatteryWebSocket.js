import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

/**
 * useBatteryWebSocket - Real-time hook for battery updates via WebSocket
 * Listens to battery.status.changed and battery.charge.updated events
 * 
 * @param {Function} onBatteryStatusChanged - Callback when battery status changes
 * @param {Function} onBatteryChargeUpdated - Callback when battery charge updates
 * @param {Boolean} enabled - Enable/disable listening (default: true)
 * @returns {Object} { isConnected, socketId }
 */
export const useBatteryWebSocket = (
  onBatteryStatusChanged,
  onBatteryChargeUpdated,
  enabled = true
) => {
  const socketRef = useRef(null);
  const listenerRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const statusChangedCallbackRef = useRef(onBatteryStatusChanged);
  const chargeUpdatedCallbackRef = useRef(onBatteryChargeUpdated);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  // Update callback refs whenever they change
  useEffect(() => {
    statusChangedCallbackRef.current = onBatteryStatusChanged;
  }, [onBatteryStatusChanged]);

  useEffect(() => {
    chargeUpdatedCallbackRef.current = onBatteryChargeUpdated;
  }, [onBatteryChargeUpdated]);

  useEffect(() => {
    if (!enabled) return;

    // Get WebSocket URL from environment or use default
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:8080";

    // Connect to /batteries namespace
    const socket = io(`${wsUrl}/batteries`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      query: {
        token: localStorage.getItem("token"),
      },
    });

    // Store socket reference
    socketRef.current = socket;
    setGlobalBatterySocket(socket);

    // Setup event listeners
    socket.on("connect", () => {
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
      setSocketId(socket.id);
      console.log(`✅ Connected to Battery WebSocket: ${socket.id}`);

      // Register listeners if not already done
      if (!listenerRef.current) {
        // Listen for battery status changes
        socket.on("battery.status.changed", (data) => {
          console.log("🔋 Battery status changed event received:", data);
          if (statusChangedCallbackRef.current) {
            statusChangedCallbackRef.current(data);
          }
        });

        // Listen for battery charge updates
        socket.on("battery.charge.updated", (data) => {
          console.log("⚡ Battery charge updated event received:", data);
          if (chargeUpdatedCallbackRef.current) {
            chargeUpdatedCallbackRef.current(data);
          }
        });

        listenerRef.current = true;
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn(`🔌 Battery WebSocket disconnected: ${reason}`);
      setIsConnected(false);
      setSocketId(null);
    });

    socket.on("connect_error", (error) => {
      console.error(`❌ Battery WebSocket error: ${error.message}`);
      reconnectAttemptsRef.current++;
      setIsConnected(false);
    });

    socket.on("error", (error) => {
      console.error(`⚠️ Battery WebSocket error: ${error}`);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off("battery.status.changed");
        socketRef.current.off("battery.charge.updated");
        socketRef.current.disconnect();
        socketRef.current = null;
        listenerRef.current = false;
        setIsConnected(false);
        setSocketId(null);
      }
    };
  }, [enabled]);

  return {
    isConnected,
    socketId,
  };
};

/**
 * Singleton reference for WebSocket status hook
 */
let globalBatterySocketRef = null;

export const setGlobalBatterySocket = (socket) => {
  globalBatterySocketRef = socket;
};

/**
 * Hook to get battery WebSocket connection status
 * Useful for displaying connection indicator in UI
 * 
 * @returns {Object} { isConnected, socketId }
 */
export const useBatteryWebSocketStatus = () => {
  const [isConnected, setIsConnected] = useState(
    globalBatterySocketRef?.connected || false
  );
  const [socketId, setSocketId] = useState(
    globalBatterySocketRef?.id || null
  );

  useEffect(() => {
    if (!globalBatterySocketRef) return;

    const socket = globalBatterySocketRef;

    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Set initial state
    setIsConnected(socket.connected);
    setSocketId(socket.id);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return {
    isConnected,
    socketId,
  };
};
