import { openModal, closeModal } from "./components/modals.js";
import { createPatientRow } from "./components/patientRows.js";
import { getAllAppointments } from "./services/appointmentRecordService.js";
import { savePrescription } from "./services/prescriptionServices.js";

const tableBody = document.getElementById("patientTableBody");
const datePicker = document.getElementById("datePicker");
const searchBar = document.getElementById("searchBar");
const message = document.getElementById("page-message");
const token = localStorage.getItem("token");
const localDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
let selectedDate = localDate();
let patientName = null;
let selectedAppointment = null;

async function loadAppointments() {
  tableBody.replaceChildren();
  try {
    const appointments = await getAllAppointments(selectedDate, patientName, token);
    if (!appointments.length) {
      showTableMessage("No Appointments found for today");
      message.textContent = "";
      return;
    }

    message.textContent = "";
    appointments.forEach(appointment => {
      const patient = {
        id: appointment.patientId,
        name: appointment.patientName,
        phone: appointment.patientPhone,
        email: appointment.patientEmail
      };
      const row = createPatientRow(
        patient,
        appointment.id,
        appointment.status === 0 ? () => {
          selectedAppointment = appointment;
          openModal("addPrescription");
        } : null
      );
      if (appointment.status === 1) row.lastElementChild.textContent = "Completed";
      const visitCell = document.createElement("td");
      visitCell.textContent = new Date(appointment.appointmentTime).toLocaleString();
      row.insertBefore(visitCell, row.lastElementChild);
      tableBody.append(row);
    });
  } catch (error) {
    showTableMessage("Unable to load appointments.");
    message.textContent = error.message;
    message.classList.add("error");
  }
}

function showTableMessage(text) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.className = "noPatientRecord";
  cell.colSpan = 6;
  cell.textContent = text;
  row.append(cell);
  tableBody.append(row);
}

async function submitPrescription(event) {
  event?.preventDefault();
  if (!selectedAppointment) return;
  const form = document.getElementById("prescription-form");
  const values = new FormData(form);
  try {
    await savePrescription({
      appointmentId: selectedAppointment.id,
      medication: values.get("medication"),
      dosage: values.get("dosage"),
      doctorNotes: values.get("doctorNotes")
    });
    closeModal();
    form.reset();
    selectedAppointment = null;
    await loadAppointments();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
}

window.submitPrescription = submitPrescription;

document.addEventListener("DOMContentLoaded", () => {
  datePicker.value = selectedDate;
  searchBar.addEventListener("input", () => {
    patientName = searchBar.value.trim() || "null";
    loadAppointments();
  });
  document.getElementById("todayButton").addEventListener("click", () => {
    selectedDate = localDate();
    datePicker.value = selectedDate;
    loadAppointments();
  });
  datePicker.addEventListener("change", () => {
    selectedDate = datePicker.value;
    loadAppointments();
  });
  loadAppointments();
});
