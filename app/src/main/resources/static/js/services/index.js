import { API_BASE_URL } from "../config/config.js";
import { openModal } from "../components/modals.js";

const ADMIN_API = API_BASE_URL + "/admin";
const DOCTOR_API = API_BASE_URL + "/doctor/login";

export async function loginAccount(role, identity, password) {
  const endpoints = {
    admin: [ADMIN_API, { username: identity, password }],
    doctor: [DOCTOR_API, { email: identity, password }],
    patient: [`${API_BASE_URL}/patient/login`, { email: identity, password }]
  };
  const request = endpoints[role];
  if (!request) throw new Error("Choose a supported account type");
  const response = await fetch(request[0], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request[1])
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Invalid credentials!");
  return result;
}

async function authenticate(role, identity, password) {
  try {
    const result = await loginAccount(role, identity, password);
    localStorage.setItem("token", result.token);
    window.selectRole(role);
    const dashboard = role === "admin" ? "adminDashboard" : "doctorDashboard";
    window.location.assign(`/${dashboard}/${encodeURIComponent(result.token)}`);
  } catch (error) {
    alert(error.message || "Invalid credentials!");
  }
}

async function adminLoginHandler(event) {
  event?.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  await authenticate("admin", username, password);
}

async function doctorLoginHandler(event) {
  event?.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  await authenticate("doctor", email, password);
}

window.adminLoginHandler = adminLoginHandler;
window.doctorLoginHandler = doctorLoginHandler;

window.onload = function () {
  const adminBtn = document.getElementById("adminLogin");
  if (adminBtn) adminBtn.addEventListener("click", () => openModal("adminLogin"));
  const doctorBtn = document.getElementById("doctorLogin");
  if (doctorBtn) doctorBtn.addEventListener("click", () => openModal("doctorLogin"));
  const patientBtn = document.getElementById("patientRole");
  if (patientBtn) {
    patientBtn.addEventListener("click", () => {
      window.selectRole("patient");
      window.location.assign("/pages/patientDashboard.html");
    });
  }

};
