import { getDoctors, createDoctor, deleteDoctor } from "./services/doctorServices.js";
import { createDoctorCard } from "./components/doctorCard.js";

const token = document.body.dataset.token;
if (!token || document.body.dataset.role !== "admin") {
  window.location.replace("/");
} else {
  localStorage.setItem("token", token);
  localStorage.setItem("userRole", "admin");
}

const content = document.getElementById("content");
const message = document.getElementById("page-message");
const dialog = document.getElementById("add-doctor-dialog");
const form = document.getElementById("add-doctor-form");

async function loadDoctors() {
  message.textContent = "Loading doctors…";
  content.replaceChildren();
  try {
    const doctors = await getDoctors({
      name: document.getElementById("searchBar").value.trim(),
      time: document.getElementById("filterTime").value,
      specialty: document.getElementById("filterSpecialty").value
    });
    const specialtySelect = document.getElementById("filterSpecialty");
    const selected = specialtySelect.value;
    specialtySelect.replaceChildren(new Option("All specialties", ""));
    [...new Set(doctors.map(doctor => doctor.specialty))].sort()
      .forEach(specialty => specialtySelect.add(new Option(specialty, specialty)));
    if (doctors.some(doctor => doctor.specialty === selected)) specialtySelect.value = selected;
    if (!doctors.length) {
      message.textContent = "No doctors match these filters.";
      return;
    }
    message.textContent = `${doctors.length} doctors`;
    doctors.forEach(doctor => content.append(createDoctorCard(doctor, {
      role: "admin",
      onDelete: async selectedDoctor => {
        if (!window.confirm(`Remove ${selectedDoctor.name} and related appointments?`)) return;
        try {
          await deleteDoctor(selectedDoctor.id);
          await loadDoctors();
        } catch (error) {
          message.textContent = error.message;
          message.classList.add("error");
        }
      }
    })));
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
}

document.getElementById("searchBar").addEventListener("input", loadDoctors);
document.getElementById("filterTime").addEventListener("change", loadDoctors);
document.getElementById("filterSpecialty").addEventListener("change", loadDoctors);
document.getElementById("open-add-doctor").addEventListener("click", () => dialog.showModal());
document.getElementById("close-add-doctor").addEventListener("click", () => dialog.close());
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  window.location.assign("/");
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  try {
    await createDoctor({
      name: data.name,
      specialty: data.specialty,
      email: data.email,
      phone: data.phone,
      password: data.password,
      availableTimes: data.availableTimes.split(",").map(value => value.trim()).filter(Boolean)
    });
    form.reset();
    dialog.close();
    message.classList.remove("error");
    message.textContent = "Doctor added.";
    await loadDoctors();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
});

loadDoctors();
