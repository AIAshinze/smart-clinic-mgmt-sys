import {
  getPatientAppointments,
  cancelAppointment,
  updateAppointment
} from "./services/appointmentRecordService.js";
import { getDoctorAvailability } from "./services/doctorServices.js";
import { getPrescription } from "./services/prescriptionServices.js";

const tableBody = document.getElementById("appointmentTableBody");
const message = document.getElementById("page-message");
const rescheduleDialog = document.getElementById("update-appointment-dialog");
let selectedAppointment;

async function loadAppointments() {
  tableBody.replaceChildren();
  message.textContent = "Loading appointments…";
  try {
    const appointments = await getPatientAppointments();
    if (!appointments.length) {
      message.textContent = "No appointments found.";
      return;
    }
    message.textContent = "";
    appointments.forEach(appointment => tableBody.append(createAppointmentRow(appointment)));
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
}

function createAppointmentRow(appointment) {
  const row = document.createElement("tr");
  const values = [
    appointment.doctorName,
    new Date(appointment.appointmentTime).toLocaleString(),
    appointment.status === 0 ? "Scheduled" : "Completed"
  ];
  values.forEach(value => {
    const cell = document.createElement("td");
    cell.textContent = value || "";
    row.append(cell);
  });

  const prescriptionCell = document.createElement("td");
  const prescriptionButton = document.createElement("button");
  prescriptionButton.type = "button";
  prescriptionButton.textContent = "View";
  prescriptionButton.addEventListener("click", () => viewPrescription(appointment.id));
  prescriptionCell.append(prescriptionButton);
  row.append(prescriptionCell);

  const actionCell = document.createElement("td");
  if (appointment.status === 0) {
    const rescheduleButton = document.createElement("button");
    rescheduleButton.type = "button";
    rescheduleButton.textContent = "Reschedule";
    rescheduleButton.addEventListener("click", () => openReschedule(appointment));
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", async () => {
      try {
        await cancelAppointment(appointment.id);
        await loadAppointments();
      } catch (error) {
        message.textContent = error.message;
        message.classList.add("error");
      }
    });
    actionCell.append(rescheduleButton, cancelButton);
  }
  row.append(actionCell);
  return row;
}

function openReschedule(appointment) {
  selectedAppointment = appointment;
  const dateInput = document.getElementById("reschedule-date");
  dateInput.min = localDate();
  const appointmentDate = appointment.appointmentTime.slice(0, 10);
  dateInput.value = appointmentDate < dateInput.min ? dateInput.min : appointmentDate;
  rescheduleDialog.showModal();
  loadAvailableTimes();
}

async function loadAvailableTimes() {
  const dateInput = document.getElementById("reschedule-date");
  const timeSelect = document.getElementById("reschedule-time");
  const status = document.getElementById("reschedule-message");
  const saveButton = document.getElementById("save-rescheduled-appointment");
  timeSelect.replaceChildren();
  saveButton.disabled = true;
  status.textContent = "Loading availability...";
  try {
    const result = await getDoctorAvailability(selectedAppointment.doctorId, dateInput.value);
    result.availableTimes.forEach(slot => timeSelect.add(new Option(slot, slot.split("-")[0].trim())));
    status.textContent = result.availableTimes.length ? "" : "No available times for this date.";
    saveButton.disabled = result.availableTimes.length === 0;
  } catch (error) {
    status.textContent = error.message;
  }
}

async function viewPrescription(appointmentId) {
  const dialog = document.getElementById("prescription-details");
  const content = document.getElementById("prescription-content");
  try {
    const prescription = await getPrescription(appointmentId);
    content.textContent = JSON.stringify(prescription, null, 2);
    dialog.showModal();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
}

function localDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

document.getElementById("reschedule-date").addEventListener("change", loadAvailableTimes);
document.getElementById("reschedule-form").addEventListener("submit", async event => {
  event.preventDefault();
  const date = document.getElementById("reschedule-date").value;
  const time = document.getElementById("reschedule-time").value;
  if (!selectedAppointment || !date || !time) {
    document.getElementById("reschedule-message").textContent = "Choose an available appointment time.";
    return;
  }
  try {
    await updateAppointment(selectedAppointment.id, {
      doctorId: selectedAppointment.doctorId,
      appointmentTime: `${date}T${time}:00`
    });
    rescheduleDialog.close();
    selectedAppointment = null;
    await loadAppointments();
  } catch (error) {
    document.getElementById("reschedule-message").textContent = error.message;
  }
});
document.getElementById("close-update-appointment").addEventListener("click", () => {
  rescheduleDialog.close();
  selectedAppointment = null;
});
document.getElementById("close-prescription-details").addEventListener("click", () => {
  document.getElementById("prescription-details").close();
});
loadAppointments();
