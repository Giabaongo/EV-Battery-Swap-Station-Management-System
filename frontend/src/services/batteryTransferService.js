import api from "./api";
import { API_ENDPOINTS } from "../constants";
import { batteryService } from "./batteryService";
import { stationService } from "./stationService";

const getAllRequests = async () => {
  try {
    const response = await api.get(
      API_ENDPOINTS.BATTERY_TRANSFER_REQUEST.GET_ALL_REQUESTS
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching transfer requests:", error);
    throw error;
  }
};

const getTicketByStationId = async (stationId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.BATTERY_TRANSFER_TICKET.GET_BY_STATION(stationId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching transfer tickets by station:", error);
    throw error;
  }
};

const getAvailableBatteries = async (transferRequestId, ticketType) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.BATTERY_TRANSFER_TICKET.GET_AVAILABLE_BATTERIES,
      {
        transfer_request_id: transferRequestId,
        ticket_type: ticketType,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching available batteries:", error);
    throw error;
  }
};

const getRequestById = async (requestId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.BATTERY_TRANSFER_REQUEST.GET_REQUEST(requestId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching transfer request:", error);
    throw error;
  }
};

const createRequest = async (requestData) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.BATTERY_TRANSFER_REQUEST.CREATE_REQUEST,
      requestData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating transfer request:", error);
    throw error;
  }
};

const updateRequest = async (requestId, updateData) => {
  try {
    const response = await api.patch(
      API_ENDPOINTS.BATTERY_TRANSFER_REQUEST.UPDATE_REQUEST(requestId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating transfer request:", error);
    throw error;
  }
};

const deleteRequest = async (requestId) => {
  try {
    const response = await api.delete(
      API_ENDPOINTS.BATTERY_TRANSFER_REQUEST.DELETE_REQUEST(requestId)
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting transfer request:", error);
    throw error;
  }
};

const createTicket = async (ticketData) => {
  try {
    const response = await api.post(
      API_ENDPOINTS.BATTERY_TRANSFER_TICKET.CREATE_TICKET,
      ticketData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating transfer ticket:", error);
    throw error;
  }
};

const getAllTickets = async () => {
  try {
    const response = await api.get(
      API_ENDPOINTS.BATTERY_TRANSFER_TICKET.GET_ALL_TICKETS
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all transfer tickets:", error);
    throw error;
  }
};

const getTicketById = async (ticketId) => {
  try {
    const response = await api.get(
      API_ENDPOINTS.BATTERY_TRANSFER_TICKET.GET_TICKET(ticketId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching transfer ticket:", error);
    throw error;
  }
};

const updateTicketById = async (ticketId, updateData) => {
  try {
    const response = await api.patch(
      API_ENDPOINTS.BATTERY_TRANSFER_TICKET.UPDATE_TICKET(ticketId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating transfer ticket:", error);
    throw error;
  }
};

const deleteTicketById = async (ticketId) => {
  try {
    const response = await api.delete(
      API_ENDPOINTS.BATTERY_TRANSFER_TICKET.DELETE_TICKET(ticketId)
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting transfer ticket:", error);
    throw error;
  }
};

const getAvailableBatteriesEnriched = async (
  transferRequestId,
  ticketType,
  stationId
) => {
  try {
    // Step 1: Get available battery list
    const availableData = await getAvailableBatteries(
      transferRequestId,
      ticketType
    );
    const batteryIds =
      availableData.available_batteries?.map((b) => b.battery_id || b.id) || [];

    if (batteryIds.length === 0) {
      return availableData;
    }

    // Step 2: Fetch full battery details by station to get current_charge
    const allStationBatteries = await batteryService.getBatteriesByStationId(
      stationId
    );

    // Step 3: Enrich available batteries with full details (current_charge, soh, etc)
    const enrichedBatteries = availableData.available_batteries
      .map((availableBattery) => {
        const fullDetails = allStationBatteries.find(
          (b) =>
            (b.battery_id || b.id) ===
            (availableBattery.battery_id || availableBattery.id)
        );
        return fullDetails
          ? { ...availableBattery, ...fullDetails }
          : availableBattery;
      })
      .filter(Boolean);

    return {
      ...availableData,
      available_batteries: enrichedBatteries,
    };
  } catch (error) {
    console.error("Error fetching available batteries with details:", error);
    throw error;
  }
};

const enrichRequestsWithStationInfo = async (requests) => {
  try {
    if (!Array.isArray(requests) || requests.length === 0) {
      return requests;
    }

    // Get unique station IDs
    const stationIds = new Set();
    requests.forEach((req) => {
      if (req.from_station_id) stationIds.add(req.from_station_id);
      if (req.to_station_id) stationIds.add(req.to_station_id);
    });

    // Fetch station info for all unique IDs
    const stationMap = new Map();
    for (const stationId of stationIds) {
      try {
        const station = await stationService.getStationById(stationId);
        stationMap.set(stationId, station);
      } catch (error) {
        console.warn(`Failed to fetch station ${stationId}:`, error);
      }
    }

    // Enrich requests with station info
    return requests.map((req) => ({
      ...req,
      fromStation: stationMap.get(req.from_station_id)
        ? {
            station_id: stationMap.get(req.from_station_id).station_id,
            station_name: stationMap.get(req.from_station_id).name, // Backend returns 'name', not 'station_name'
          }
        : {
            station_id: req.from_station_id,
            station_name: "Unknown",
          },
      toStation: stationMap.get(req.to_station_id)
        ? {
            station_id: stationMap.get(req.to_station_id).station_id,
            station_name: stationMap.get(req.to_station_id).name, // Backend returns 'name', not 'station_name'
          }
        : {
            station_id: req.to_station_id,
            station_name: "Unknown",
          },
    }));
  } catch (error) {
    console.error("Error enriching requests with station info:", error);
    return requests; // Return original requests if enrichment fails
  }
};

const enrichTicketsWithTransferRequestInfo = async (tickets) => {
  try {
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return tickets;
    }

    // Get unique transfer request IDs
    const transferRequestIds = new Set();
    tickets.forEach((ticket) => {
      if (ticket.transfer_request_id) {
        transferRequestIds.add(ticket.transfer_request_id);
      }
    });

    // Fetch transfer request info for all unique IDs
    const transferRequestMap = new Map();
    for (const requestId of transferRequestIds) {
      try {
        const request = await getRequestById(requestId);
        transferRequestMap.set(requestId, request);
      } catch (error) {
        console.warn(`Failed to fetch transfer request ${requestId}:`, error);
      }
    }

    // Get unique station IDs from transfer requests
    const stationIds = new Set();
    transferRequestMap.forEach((req) => {
      if (req.from_station_id) stationIds.add(req.from_station_id);
      if (req.to_station_id) stationIds.add(req.to_station_id);
    });

    // Fetch station info for all unique IDs
    const stationMap = new Map();
    for (const stationId of stationIds) {
      try {
        const station = await stationService.getStationById(stationId);
        stationMap.set(stationId, station);
      } catch (error) {
        console.warn(`Failed to fetch station ${stationId}:`, error);
      }
    }

    // Enrich tickets with transfer request and station info
    return tickets.map((ticket) => {
      const transferRequest =
        transferRequestMap.get(ticket.transfer_request_id) || {};
      return {
        ...ticket,
        status: transferRequest.status || "in_progress",
        fromStation: stationMap.get(transferRequest.from_station_id)
          ? {
              station_id: stationMap.get(transferRequest.from_station_id)
                .station_id,
              station_name: stationMap.get(transferRequest.from_station_id)
                .name, // Backend returns 'name', not 'station_name'
            }
          : {
              station_id: transferRequest.from_station_id,
              station_name: "Unknown",
            },
        toStation: stationMap.get(transferRequest.to_station_id)
          ? {
              station_id: stationMap.get(transferRequest.to_station_id)
                .station_id,
              station_name: stationMap.get(transferRequest.to_station_id).name, // Backend returns 'name', not 'station_name'
            }
          : {
              station_id: transferRequest.to_station_id,
              station_name: "Unknown",
            },
        battery_model: transferRequest.battery_model || "N/A",
        quantity: transferRequest.quantity || 0,
      };
    });
  } catch (error) {
    console.error("Error enriching tickets with transfer request info:", error);
    return tickets; // Return original tickets if enrichment fails
  }
};

export const batteryTransferService = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  getTicketByStationId,
  getAvailableBatteries,
  getAvailableBatteriesEnriched,
  enrichRequestsWithStationInfo,
  enrichTicketsWithTransferRequestInfo,
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicketById,
  deleteTicketById,
};

export default batteryTransferService;
