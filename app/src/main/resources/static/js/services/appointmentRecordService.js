import { apiRequest, jsonBody } from "./api.js";
import { API_BASE_URL } from "../config/config.js";

const APPOINTMENT_API = `${API_BASE_URL}/appointment`;

export function bookAppointment(appointment) {
  return apiRequest(APPOINTMENT_API, { method: "POST", body: jsonBody(appointment) });
}

export function updateAppointment(id, appointment) {
  return apiRequest(`${APPOINTMENT_API}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(appointment)
  });
}

export function cancelAppointment(id) {
  return apiRequest(`${APPOINTMENT_API}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function getPatientAppointments() {
  return apiRequest(`${APPOINTMENT_API}/mine`);
}

export function getDoctorAppointments(date, patientName = "") {
  const params = new URLSearchParams({ date });
  if (patientName) params.set("patientName", patientName);
  return apiRequest(`${APPOINTMENT_API}/doctor?${params}`);
}

export function getAllAppointments(date, patientName = null, token = localStorage.getItem("token")) {
  if (date) {
    const params = new URLSearchParams({ date });
    if (patientName && patientName !== "null") params.set("patientName", patientName);
    return apiRequest(`${APPOINTMENT_API}/doctor?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }
  return apiRequest(APPOINTMENT_API, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function completeAppointment(id) {
  return apiRequest(`${APPOINTMENT_API}/${encodeURIComponent(id)}/complete`, { method: "PATCH" });
}
