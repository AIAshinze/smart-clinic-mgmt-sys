import { apiRequest, jsonBody } from "./api.js";

export function patientSignup(patient) {
  return apiRequest("/api/patients/register", { method: "POST", body: jsonBody(patient) });
}

export function patientLogin(credentials) {
  return apiRequest("/api/patients/login", { method: "POST", body: jsonBody(credentials) });
}

export function getPatientData() {
  return apiRequest("/api/patients/me");
}

export function updatePatientProfile(profile) {
  return apiRequest("/api/patients/me", { method: "PATCH", body: jsonBody(profile) });
}

export function getPatients() {
  return apiRequest("/api/patients");
}

export function getPatientById(id) {
  return apiRequest(`/api/patients/${encodeURIComponent(id)}`);
}

export function updatePatient(id, patient) {
  return apiRequest(`/api/patients/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(patient)
  });
}

export function deletePatient(id) {
  return apiRequest(`/api/patients/${encodeURIComponent(id)}`, { method: "DELETE" });
}
