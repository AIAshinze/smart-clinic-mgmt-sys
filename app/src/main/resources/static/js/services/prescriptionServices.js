import { apiRequest, jsonBody } from "./api.js";
import { API_BASE_URL } from "../config/config.js";

const PRESCRIPTION_API = `${API_BASE_URL}/prescription`;

export function savePrescription(prescription) {
  return apiRequest(PRESCRIPTION_API, { method: "POST", body: jsonBody(prescription) });
}

export function getPrescription(appointmentId) {
  return apiRequest(`${PRESCRIPTION_API}/appointment/${encodeURIComponent(appointmentId)}`);
}

export function getMyPrescriptions() {
  return apiRequest(`${PRESCRIPTION_API}/mine`);
}

export function updatePrescription(id, prescription) {
  return apiRequest(`${PRESCRIPTION_API}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(prescription)
  });
}

export function deletePrescription(id) {
  return apiRequest(`${PRESCRIPTION_API}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
