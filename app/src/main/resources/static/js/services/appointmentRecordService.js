import { apiRequest, jsonBody } from "./api.js";

export function bookAppointment(appointment) {
  return apiRequest("/api/appointments", { method: "POST", body: jsonBody(appointment) });
}

export function updateAppointment(id, appointment) {
  return apiRequest(`/api/appointments/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(appointment)
  });
}

export function cancelAppointment(id) {
  return apiRequest(`/api/appointments/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getPatientAppointments() {
  return apiRequest("/api/appointments/mine");
}

export function getDoctorAppointments(date, patientName = "") {
  const params = new URLSearchParams({ date });
  if (patientName) params.set("patientName", patientName);
  return apiRequest(`/api/appointments/doctor?${params}`);
}

export function getAllAppointments() {
  return apiRequest("/api/appointments");
}

export function completeAppointment(id) {
  return apiRequest(`/api/appointments/${encodeURIComponent(id)}/complete`, { method: "PATCH" });
}
