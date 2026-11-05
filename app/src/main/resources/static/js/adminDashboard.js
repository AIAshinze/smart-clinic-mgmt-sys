import { openModal, closeModal } from "./components/modals.js";
import { filterDoctors, getDoctors, saveDoctor } from "./services/doctorServices.js";
import { createDoctorCard } from "./components/doctorCard.js";

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
  message.textContent = doctors.length ? "" : "No doctors found";
}

async function filterDoctorsOnChange() {
  const name = document.getElementById("searchBar").value.trim();
  const time = document.getElementById("filterTime").value;
  const specialty = document.getElementById("filterSpecialty").value;
  const doctors = await filterDoctors(name, time, specialty);
  renderDoctorCards(doctors);
  message.textContent = doctors.length ? "" : "No doctors found";
}

async function adminAddDoctor(event) {
  event?.preventDefault();
  const form = document.getElementById("add-doctor-form");
  const values = new FormData(form);
  const doctor = {
    name: values.get("name"),
    specialty: values.get("specialty"),
    email: values.get("email"),
    password: values.get("password"),
    phone: values.get("phone"),
    availableTimes: values.getAll("availableTimes")
  };
  try {
    const result = await saveDoctor(doctor, localStorage.getItem("token"));
    if (!result.success) throw new Error(result.message);
    closeModal();
    form.reset();
    message.textContent = "Doctor added successfully.";
    await loadDoctorCards();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
}

window.adminAddDoctor = adminAddDoctor;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addDocBtn")?.addEventListener("click", () => openModal("addDoctor"));
  document.getElementById("searchBar").addEventListener("input", filterDoctorsOnChange);
  document.getElementById("filterTime").addEventListener("change", filterDoctorsOnChange);
  document.getElementById("filterSpecialty").addEventListener("change", filterDoctorsOnChange);
  loadDoctorCards().catch(error => {
    message.textContent = error.message;
    message.classList.add("error");
  });
});
