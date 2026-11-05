import { createDoctorCard } from "./components/doctorCard.js";
import { closeModal, openModal } from "./components/modals.js";
import { filterDoctors, getDoctors } from "./services/doctorServices.js";
import { patientLogin, patientSignup } from "./services/patientServices.js";

const contentDiv = document.getElementById("content");
const message = document.getElementById("page-message");

function renderDoctorCards(doctors) {
  contentDiv.replaceChildren();
  for (const doctor of doctors) {
    contentDiv.append(createDoctorCard(doctor));
  }
  window.renderDoctorCards = renderDoctorCards;
}

async function loadDoctorCards() {
  const doctors = await getDoctors();
  renderDoctorCards(doctors);
  message.textContent = doctors.length ? "" : "No doctors found.";
}

async function filterDoctorsOnChange() {
  const name = document.getElementById("searchBar").value.trim();
  const time = document.getElementById("filterTime").value;
  const specialty = document.getElementById("filterSpecialty").value;
  const doctors = await filterDoctors(name, time, specialty);
  renderDoctorCards(doctors);
  message.textContent = doctors.length ? "" : "No doctors found with the given filters.";
}

async function signupPatient(event) {
  event?.preventDefault();
  const form = document.getElementById("patient-signup-form");
  const patient = Object.fromEntries(new FormData(form));
  try {
    const result = await patientSignup(patient);
    if (!result.success) throw new Error(result.message);
    closeModal();
    alert("Patient account created. Please log in.");
  } catch (error) {
    alert(error.message);
  }
}

async function loginPatient(event) {
  event?.preventDefault();
  const form = document.getElementById("patient-login-form");
  const credentials = Object.fromEntries(new FormData(form));
  try {
    const response = await patientLogin(credentials);
    if (!response?.ok) {
      const error = response ? await response.json() : null;
      throw new Error(error?.message || "Invalid credentials!");
    }
    const result = await response.json();
    localStorage.setItem("token", result.token);
    window.selectRole("loggedPatient");
    window.location.assign("/pages/loggedPatientDashboard.html");
  } catch (error) {
    alert(error.message);
  }
}

window.signupPatient = signupPatient;
window.loginPatient = loginPatient;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("patientSignup")?.addEventListener("click", () => openModal("patientSignup"));
  document.getElementById("patientLogin")?.addEventListener("click", () => openModal("patientLogin"));
  document.getElementById("searchBar").addEventListener("input", filterDoctorsOnChange);
  document.getElementById("filterTime").addEventListener("change", filterDoctorsOnChange);
  document.getElementById("filterSpecialty").addEventListener("change", filterDoctorsOnChange);
  loadDoctorCards().catch(error => {
    message.textContent = error.message;
    message.classList.add("error");
  });
});
