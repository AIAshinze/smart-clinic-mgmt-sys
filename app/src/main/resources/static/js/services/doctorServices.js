import { apiRequest, jsonBody } from "./api.js";

export function getDoctors(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.size ? `?${params}` : "";
  return apiRequest(`/api/doctors${query}`);
}

export function getDoctorAvailability(id, date) {
  return apiRequest(`/api/doctors/${encodeURIComponent(id)}/availability?date=${encodeURIComponent(date)}`);
}

export function createDoctor(doctor) {
  return apiRequest("/api/doctors", { method: "POST", body: jsonBody(doctor) });
}

export function updateDoctor(id, doctor) {
  return apiRequest(`/api/doctors/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(doctor)
  });
}

export function deleteDoctor(id) {
  return apiRequest(`/api/doctors/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getSpecialties() {
  const doctors = await getDoctors();
  return [...new Set(doctors.map(doctor => doctor.specialty))].sort();
}
