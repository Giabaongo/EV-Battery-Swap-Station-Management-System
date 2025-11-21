import { useEffect, useRef } from "react";
import io from "socket.io-client";

/**
 * useTransferWebSocket - Real-time hook for transfer request updates via WebSocket
 * Connects to 'battery-transfer-request' namespace
 * Listens to: transfer.request.created, transfer.request.updated, transfer.request.status.updated
 *
 * @param {Function} onTransferRequestCreated - Callback when new transfer request created
 * @param {Function} onTransferRequestUpdated - Callback when transfer request updated
 * @param {Function} onTransferRequestStatusUpdated - Callback when transfer request status updated
 * @param {Boolean} enabled - Enable/disable listening (default: true)
 * @returns {Object} { isConnected, socketId }
 */
export const useTransferWebSocket = (
  onTransferRequestCreated,
  onTransferRequestUpdated,
  onTransferRequestStatusUpdated,
  enabled = true
) => {
  const socketRef = useRef(null);
  const listenerRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const createdCallbackRef = useRef(onTransferRequestCreated);
  const updatedCallbackRef = useRef(onTransferRequestUpdated);
  const statusUpdatedCallbackRef = useRef(onTransferRequestStatusUpdated);

  // Update callback refs whenever they change
  useEffect(() => {
    createdCallbackRef.current = onTransferRequestCreated;
  }, [onTransferRequestCreated]);
  
  useEffect(() => {
    updatedCallbackRef.current = onTransferRequestUpdated;
  }, [onTransferRequestUpdated]);
  
  useEffect(() => {
    statusUpdatedCallbackRef.current = onTransferRequestStatusUpdated;
  }, [onTransferRequestStatusUpdated]);

  useEffect(() => {
    if (!enabled) return;

    // Get WebSocket URL from environment or use default
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8080";

    // Connect to /battery-transfer-request namespace
    const socket = io(`${wsUrl}/battery-transfer-request`, {
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
    setGlobalTransferSocket(socket);

    // Setup event listeners
    socket.on("connect", () => {
      reconnectAttemptsRef.current = 0;
      console.log(`✅ Connected to Transfer Request WebSocket: ${socket.id}`);

      // Register listeners if not already done
      if (!listenerRef.current) {
        socket.on("transfer.request.created", (data) => {
          console.log("📢 Transfer request created event:", data);
          if (createdCallbackRef.current) {
            createdCallbackRef.current(data);
          }
        });
        
        socket.on("transfer.request.updated", (data) => {
          console.log("📢 Transfer request updated event:", data);
          if (updatedCallbackRef.current) {
            updatedCallbackRef.current(data);
          }
        });
        
        socket.on("transfer.request.status.updated", (data) => {
          console.log("📢 Transfer request status updated event:", data);
          if (statusUpdatedCallbackRef.current) {
            statusUpdatedCallbackRef.current(data);
          }
        });
        
        listenerRef.current = true;
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn(`🔌 Transfer Request WebSocket disconnected: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.error(`❌ Transfer Request WebSocket error: ${error.message}`);
      reconnectAttemptsRef.current++;
    });

    socket.on("error", (error) => {
      console.error(`⚠️ Transfer Request WebSocket error: ${error}`);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off("transfer.request.created");
        socketRef.current.off("transfer.request.updated");
        socketRef.current.off("transfer.request.status.updated");
        socketRef.current.disconnect();
        socketRef.current = null;
        listenerRef.current = false;
      }
    };
  }, [enabled]);

  return {
    isConnected: socketRef.current?.connected || false,
    socketId: socketRef.current?.id || null,
  };
};

/**
 * Singleton reference for WebSocket status hook
 */
let globalTransferSocketRef = null;

export const setGlobalTransferSocket = (socket) => {
  globalTransferSocketRef = socket;
};

/**
 * Hook to get transfer WebSocket connection status
 *
 * @returns {Object} { isConnected, socketId }
 */
export const useTransferWebSocketStatus = () => {
  return {
    isConnected: globalTransferSocketRef?.connected || false,
    socketId: globalTransferSocketRef?.id || null,
  };
};
