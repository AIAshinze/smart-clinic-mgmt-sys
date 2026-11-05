import { apiRequest, jsonBody } from "./api.js";
import { API_BASE_URL } from "../config/config.js";

const PATIENT_API = `${API_BASE_URL}/patient`;

export function patientSignup(patient) {
  return apiRequest(`${PATIENT_API}/register`, { method: "POST", body: jsonBody(patient) })
    .then(() => ({ success: true, message: "Patient registered successfully." }))
    .catch(error => ({ success: false, message: error.message }));
}

export async function patientLogin(credentials) {
  try {
    return await fetch(`${PATIENT_API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonBody(credentials)
    });
  } catch (error) {
    console.error("Unable to log in patient:", error);
    return null;
  }
}

export async function getPatientData(token = localStorage.getItem("token")) {
  try {
    return await apiRequest(`${PATIENT_API}/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  } catch (error) {
    console.error("Unable to load patient profile:", error);
    return null;
  }
}

export function updatePatientProfile(profile) {
  return apiRequest(`${PATIENT_API}/me`, { method: "PATCH", body: jsonBody(profile) });
}

export function getPatients() {
  return apiRequest(PATIENT_API);
}

export function getPatientById(id) {
  return apiRequest(`${PATIENT_API}/${encodeURIComponent(id)}`);
}

export function updatePatient(id, patient) {
  return apiRequest(`${PATIENT_API}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(patient)
  });
}

export function deletePatient(id) {
  return apiRequest(`${PATIENT_API}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getPatientAppointments(id, token, user = "patient") {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const path = user === "doctor" ? `${API_BASE_URL}/appointment/doctor` : `${API_BASE_URL}/appointment/mine`;
  try {
    return await apiRequest(path, { headers });
  } catch (error) {
    console.error("Unable to load appointments:", error);
    return null;
  }
}

export async function filterAppointments(condition, name, token) {
  const appointments = await getPatientAppointments(null, token, "patient");
  if (!appointments) return [];
  const normalizedName = (name || "").toLowerCase();
  return appointments.filter(appointment => {
    const matchesStatus = !condition
      || (condition === "pending" && appointment.status === 0)
      || (condition === "consulted" && appointment.status === 1);
    const matchesName = !normalizedName
      || (appointment.patientName || "").toLowerCase().includes(normalizedName);
    return matchesStatus && matchesName;
  });
}
