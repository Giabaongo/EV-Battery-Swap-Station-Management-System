import { useEffect, useRef } from "react";
import io from "socket.io-client";

/**
 * useTicketWebSocket - Real-time hook for transfer ticket updates via WebSocket
 * Connects to 'battery-transfer-ticket' namespace
 * Listens to: transfer.ticket.created, export.ticket.completed, import.ticket.completed
 *
 * @param {Function} onTicketCreated - Callback when ticket created (export or import)
 * @param {Function} onExportCompleted - Callback when export ticket completed
 * @param {Function} onImportCompleted - Callback when import ticket completed
 * @param {Boolean} enabled - Enable/disable listening (default: true)
 * @returns {Object} { isConnected, socketId }
 */
export const useTicketWebSocket = (
  onTicketCreated,
  onExportCompleted,
  onImportCompleted,
  enabled = true
) => {
  const socketRef = useRef(null);
  const listenerRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const ticketCreatedCallbackRef = useRef(onTicketCreated);
  const exportCompletedCallbackRef = useRef(onExportCompleted);
  const importCompletedCallbackRef = useRef(onImportCompleted);

  // Update callback refs whenever they change
  useEffect(() => {
    ticketCreatedCallbackRef.current = onTicketCreated;
  }, [onTicketCreated]);
  
  useEffect(() => {
    exportCompletedCallbackRef.current = onExportCompleted;
  }, [onExportCompleted]);
  
  useEffect(() => {
    importCompletedCallbackRef.current = onImportCompleted;
  }, [onImportCompleted]);

  useEffect(() => {
    if (!enabled) return;

    // Get WebSocket URL from environment or use default
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8080";

    // Connect to /battery-transfer-ticket namespace
    const socket = io(`${wsUrl}/battery-transfer-ticket`, {
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
    setGlobalTicketSocket(socket);

    // Setup event listeners
    socket.on("connect", () => {
      reconnectAttemptsRef.current = 0;
      console.log(`✅ Connected to Transfer Ticket WebSocket: ${socket.id}`);

      // Register listeners if not already done
      if (!listenerRef.current) {
        // Listen for any ticket creation (export or import)
        socket.on("transfer.ticket.created", (data) => {
          console.log("📢 Transfer ticket created event:", data);
          if (ticketCreatedCallbackRef.current) {
            ticketCreatedCallbackRef.current(data);
          }
        });
        
        // Listen for export ticket completion
        socket.on("export.ticket.completed", (data) => {
          console.log("📢 Export ticket completed event:", data);
          if (exportCompletedCallbackRef.current) {
            exportCompletedCallbackRef.current(data);
          }
        });
        
        // Listen for import ticket completion
        socket.on("import.ticket.completed", (data) => {
          console.log("📢 Import ticket completed event:", data);
          if (importCompletedCallbackRef.current) {
            importCompletedCallbackRef.current(data);
          }
        });
        
        listenerRef.current = true;
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn(`🔌 Transfer Ticket WebSocket disconnected: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.error(`❌ Transfer Ticket WebSocket error: ${error.message}`);
      reconnectAttemptsRef.current++;
    });

    socket.on("error", (error) => {
      console.error(`⚠️ Transfer Ticket WebSocket error: ${error}`);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off("transfer.ticket.created");
        socketRef.current.off("export.ticket.completed");
        socketRef.current.off("import.ticket.completed");
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
let globalTicketSocketRef = null;

export const setGlobalTicketSocket = (socket) => {
  globalTicketSocketRef = socket;
};

/**
 * Hook to get ticket WebSocket connection status
 *
 * @returns {Object} { isConnected, socketId }
 */
export const useTicketWebSocketStatus = () => {
  return {
    isConnected: globalTicketSocketRef?.connected || false,
    socketId: globalTicketSocketRef?.id || null,
  };
};
