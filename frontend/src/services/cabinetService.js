import api from "./api";
import { API_ENDPOINTS } from "../constants";

export const cabinetService = {
  getCabinets: () => api.get(API_ENDPOINTS.CABINET.GET_CABINETS),
  getCabinetById: (id) => api.get(API_ENDPOINTS.CABINET.GET_CABINET(id)),
  createCabinet: (data) => api.post(API_ENDPOINTS.CABINET.CREATE_CABINET, data),
  updateCabinet: (id, data) =>
    api.patch(API_ENDPOINTS.CABINET.UPDATE_CABINET(id), data),
  deleteCabinet: (id) => api.delete(API_ENDPOINTS.CABINET.DELETE_CABINET(id)),
  getAvailableSlots: (station_id) =>
    api.get(API_ENDPOINTS.CABINET.GET_AVAILABLE_SLOTS(station_id)),
};
