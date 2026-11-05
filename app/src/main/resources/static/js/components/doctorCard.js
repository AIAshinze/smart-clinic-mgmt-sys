import { deleteDoctor } from "../services/doctorServices.js";
import { getPatientData } from "../services/patientServices.js";
import { showBookingOverlay } from "./modals.js";

export function createDoctorCard(doctor) {
  const card = document.createElement("article");
  card.classList.add("doctor-card");

  const infoDiv = document.createElement("div");
  infoDiv.classList.add("doctor-info");
  const name = document.createElement("h3");
  name.textContent = doctor.name;
  const specialty = document.createElement("p");
  specialty.textContent = doctor.specialty;
  const email = document.createElement("p");
  email.textContent = doctor.email;
  const availability = document.createElement("p");
  availability.textContent = (doctor.availableTimes || []).join(", ");
  infoDiv.append(name, specialty, email, availability);

  const actionsDiv = document.createElement("div");
  actionsDiv.classList.add("card-actions");
  const role = localStorage.getItem("userRole");
  if (role === "admin") {
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Delete";
    removeBtn.addEventListener("click", async () => {
      if (!window.confirm(`Remove ${doctor.name}?`)) return;
      try {
        const result = await deleteDoctor(doctor.id, localStorage.getItem("token"));
        if (!result.success) throw new Error(result.message);
        card.remove();
      } catch (error) {
        alert(error.message);
      }
    });
    actionsDiv.append(removeBtn);
  } else if (role === "patient") {
    const bookNow = document.createElement("button");
    bookNow.type = "button";
    bookNow.textContent = "Book Now";
    bookNow.addEventListener("click", () => alert("Patient needs to login first."));
    actionsDiv.append(bookNow);
  } else if (role === "loggedPatient") {
    const bookNow = document.createElement("button");
    bookNow.type = "button";
    bookNow.textContent = "Book Now";
    bookNow.addEventListener("click", async event => {
      try {
        const patientData = await getPatientData(localStorage.getItem("token"));
        if (!patientData) throw new Error("Unable to load your patient profile.");
        showBookingOverlay(event, doctor, patientData);
      } catch (error) {
        alert(error.message);
      }
    });
    actionsDiv.append(bookNow);
  }

  card.append(infoDiv, actionsDiv);
  return card;
}
