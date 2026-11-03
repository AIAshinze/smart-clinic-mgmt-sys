import { apiRequest, jsonBody } from "./api.js";
import { patientLogin } from "./patientServices.js";

export async function loginAccount(role, identity, password) {
  if (role === "admin") {
    return apiRequest("/api/admin/login", {
      method: "POST",
      body: jsonBody({ username: identity, password })
    });
  }
  if (role === "doctor") {
    return apiRequest("/api/doctors/login", {
      method: "POST",
      body: jsonBody({ email: identity, password })
    });
  }
  if (role === "patient") {
    return patientLogin({ email: identity, password });
  }
  throw new Error("Choose a supported account type");
}
