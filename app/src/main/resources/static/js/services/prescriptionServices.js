import { apiRequest, jsonBody } from "./api.js";

export function savePrescription(prescription) {
  return apiRequest("/api/prescriptions", { method: "POST", body: jsonBody(prescription) });
}

export function getPrescription(appointmentId) {
  return apiRequest(`/api/prescriptions/appointment/${encodeURIComponent(appointmentId)}`);
}

export function getMyPrescriptions() {
  return apiRequest("/api/prescriptions/mine");
}

export function updatePrescription(id, prescription) {
  return apiRequest(`/api/prescriptions/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(prescription)
  });
}

export function deletePrescription(id) {
  return apiRequest(`/api/prescriptions/${encodeURIComponent(id)}`, { method: "DELETE" });
}
