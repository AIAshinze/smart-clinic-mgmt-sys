import { API_BASE_URL } from "../config/config.js";

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("token");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 && token) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.dispatchEvent(new Event("clinic:session-expired"));
  }
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    throw new Error(result?.message || `Request failed (${response.status})`);
  }
  return result;
}

export function jsonBody(value) {
  return JSON.stringify(value);
}
