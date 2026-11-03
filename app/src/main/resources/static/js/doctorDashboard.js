import { getDoctorAppointments } from "./services/appointmentRecordService.js";
import { savePrescription } from "./services/prescriptionServices.js";

const token = document.body.dataset.token;
if (!token || document.body.dataset.role !== "doctor") {
  window.location.replace("/");
} else {
  localStorage.setItem("token", token);
  localStorage.setItem("userRole", "doctor");
}

const dateInput = document.getElementById("datePicker");
const searchInput = document.getElementById("searchBar");
const tableBody = document.getElementById("patientTableBody");
const message = document.getElementById("page-message");
const dialog = document.getElementById("prescription-dialog");
const form = document.getElementById("prescription-form");
let selectedAppointment;

function localDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

async function loadAppointments() {
  tableBody.replaceChildren();
  message.textContent = "Loading appointments…";
  try {
    const appointments = await getDoctorAppointments(dateInput.value, searchInput.value.trim());
    if (!appointments.length) {
      message.textContent = "No appointments found for this date.";
      return;
    }
    message.textContent = `${appointments.length} appointments`;
    appointments.forEach(appointment => {
      const row = document.createElement("tr");
      [
        appointment.patientId,
        appointment.patientName,
        appointment.patientPhone,
        appointment.patientEmail,
        new Date(appointment.appointmentTime).toLocaleString()
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      });
      const actionCell = document.createElement("td");
      if (appointment.status === 0) {
        const button = document.createElement("button");
        button.className = "button button-primary";
        button.type = "button";
        button.textContent = "Add prescription";
        button.addEventListener("click", () => {
          selectedAppointment = appointment;
          document.getElementById("prescription-title").textContent = `Prescription for ${appointment.patientName}`;
          dialog.showModal();
        });
        actionCell.append(button);
      } else {
        actionCell.textContent = "Completed";
      }
      row.append(actionCell);
      tableBody.append(row);
    });
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
}

document.getElementById("appointment-filter").addEventListener("submit", event => {
  event.preventDefault();
  loadAppointments();
});
document.getElementById("close-prescription").addEventListener("click", () => dialog.close());
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  window.location.assign("/");
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!selectedAppointment) return;
  const details = Object.fromEntries(new FormData(form));
  try {
    await savePrescription({ ...details, appointmentId: selectedAppointment.id });
    form.reset();
    dialog.close();
    message.classList.remove("error");
    message.textContent = "Prescription saved and appointment completed.";
    await loadAppointments();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
});

dateInput.value = localDate();
dateInput.addEventListener("change", loadAppointments);
loadAppointments();
