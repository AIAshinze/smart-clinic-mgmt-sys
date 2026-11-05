import { API_BASE_URL } from "../config/config.js";
import { apiRequest, jsonBody } from "./api.js";

const DOCTOR_API = `${API_BASE_URL}/doctor`;

export async function getDoctors(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.size ? `?${params}` : "";
  try {
    return await apiRequest(`${DOCTOR_API}${query}`);
  } catch (error) {
    console.error("Unable to load doctors:", error);
    return [];
  }
}

export function filterDoctors(name = "", time = "", specialty = "") {
  return getDoctors({ name, time, specialty });
}

export function getDoctorAvailability(id, date) {
  return apiRequest(`${DOCTOR_API}/${encodeURIComponent(id)}/availability?date=${encodeURIComponent(date)}`);
}

export function saveDoctor(doctor, token = localStorage.getItem("token")) {
  return apiRequest(DOCTOR_API, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: jsonBody(doctor)
  }).then(data => ({ success: true, message: data?.message || "Doctor saved successfully.", data }))
    .catch(error => {
      console.error("Unable to save doctor:", error);
      return { success: false, message: error.message };
    });
}

export function createDoctor(doctor, token) {
  return saveDoctor(doctor, token);
}

export function updateDoctor(id, doctor, token) {
  return apiRequest(`${DOCTOR_API}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: jsonBody(doctor)
  });
}

export function deleteDoctor(id, token = localStorage.getItem("token")) {
  return apiRequest(`${DOCTOR_API}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }).then(() => ({ success: true, message: "Doctor deleted successfully." }))
    .catch(error => {
      console.error("Unable to delete doctor:", error);
      return { success: false, message: error.message };
    });
}

export async function getSpecialties() {
  const doctors = await getDoctors();
  return [...new Set(doctors.map(doctor => doctor.specialty))].sort();
}
