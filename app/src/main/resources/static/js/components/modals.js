import { getDoctorAvailability } from "../services/doctorServices.js";
import { bookAppointment } from "../services/appointmentRecordService.js";

const modalMarkup = {
  adminLogin: `
    <form id="admin-login-form" class="modal-form">
      <h2>Admin Login</h2>
      <label>Username<input id="username" name="username" autocomplete="username" required></label>
      <label>Password<input id="password" name="password" type="password" autocomplete="current-password" required></label>
      <button type="submit">Login</button>
    </form>`,
  doctorLogin: `
    <form id="doctor-login-form" class="modal-form">
      <h2>Doctor Login</h2>
      <label>Email<input id="email" name="email" type="email" autocomplete="username" required></label>
      <label>Password<input id="password" name="password" type="password" autocomplete="current-password" required></label>
      <button type="submit">Login</button>
    </form>`,
  patientLogin: `
    <form id="patient-login-form" class="modal-form">
      <h2>Patient Login</h2>
      <label>Email<input id="email" name="email" type="email" required></label>
      <label>Password<input id="password" name="password" type="password" required></label>
      <button type="submit">Login</button>
    </form>`,
  patientSignup: `
    <form id="patient-signup-form" class="modal-form">
      <h2>Patient Sign Up</h2>
      <label>Name<input name="name" minlength="3" maxlength="100" required></label>
      <label>Email<input name="email" type="email" required></label>
      <label>Password<input name="password" type="password" minlength="6" required></label>
      <label>Phone<input name="phone" inputmode="numeric" pattern="[0-9]{10}" required></label>
      <label>Address<input name="address" maxlength="255" required></label>
      <button type="submit">Create account</button>
    </form>`,
  addDoctor: `
    <form id="add-doctor-form" class="modal-form">
      <h2>Add Doctor</h2>
      <label>Name<input name="name" minlength="3" maxlength="100" required></label>
      <label>Specialty<input name="specialty" minlength="3" maxlength="50" required></label>
      <label>Email<input name="email" type="email" required></label>
      <label>Password<input name="password" type="password" minlength="6" required></label>
      <label>Phone<input name="phone" inputmode="numeric" pattern="[0-9]{10}" required></label>
      <fieldset>
        <legend>Availability</legend>
        <label><input type="checkbox" name="availableTimes" value="09:00-10:00">09:00-10:00</label>
        <label><input type="checkbox" name="availableTimes" value="10:00-11:00">10:00-11:00</label>
        <label><input type="checkbox" name="availableTimes" value="11:00-12:00">11:00-12:00</label>
        <label><input type="checkbox" name="availableTimes" value="14:00-15:00">14:00-15:00</label>
        <label><input type="checkbox" name="availableTimes" value="15:00-16:00">15:00-16:00</label>
      </fieldset>
      <button type="submit">Save Doctor</button>
    </form>`,
  addPrescription: `
    <form id="prescription-form" class="modal-form">
      <h2>Add Prescription</h2>
      <label>Medication<input name="medication" minlength="3" maxlength="100" required></label>
      <label>Dosage<input name="dosage" minlength="3" maxlength="20" required></label>
      <label>Doctor Notes<textarea name="doctorNotes" maxlength="200"></textarea></label>
      <button type="submit">Save Prescription</button>
    </form>`
};

export function openModal(typeOrDialog) {
  if (typeOrDialog instanceof HTMLDialogElement) {
    if (!typeOrDialog.open) typeOrDialog.showModal();
    return;
  }
  const modal = document.getElementById("modal");
  const body = document.getElementById("modal-body");
  if (!modal || !body || !modalMarkup[typeOrDialog]) {
    throw new TypeError(`Unknown modal: ${typeOrDialog}`);
  }
  body.innerHTML = modalMarkup[typeOrDialog];
  body.querySelectorAll("input, textarea, select").forEach(field => field.classList.add("input-field"));
  body.querySelectorAll("form button").forEach(button => button.classList.add("button", "button-primary"));
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
  const closeButton = modal.querySelector("#closeModal");
  if (closeButton) closeButton.onclick = closeModal;
  modal.onclick = closeOnBackdrop;
  attachFormHandler(typeOrDialog, body.querySelector("form"));
}

function attachFormHandler(type, form) {
  const handlers = {
    adminLogin: window.adminLoginHandler,
    doctorLogin: window.doctorLoginHandler,
    patientLogin: window.loginPatient,
    patientSignup: window.signupPatient,
    addDoctor: window.adminAddDoctor,
    addPrescription: window.submitPrescription
  };
  const handler = handlers[type];
  if (handler && form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      handler(event);
    });
  }
}

function closeOnBackdrop(event) {
  if (event.target === event.currentTarget) closeModal();
}

export function closeModal(dialog) {
  if (dialog instanceof HTMLDialogElement) {
    if (dialog.open) dialog.close();
    return;
  }
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

export function showBookingOverlay(event, doctor, patientData) {
  document.querySelector(".modalApp")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "modalApp active";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const heading = document.createElement("h2");
  heading.textContent = `Book an appointment with ${doctor.name}`;
  const patient = document.createElement("p");
  patient.textContent = `Patient: ${patientData.name}`;
  const date = document.createElement("input");
  date.type = "date";
  date.required = true;
  date.min = localDate();
  date.value = localDate();
  const times = document.createElement("select");
  times.required = true;
  const message = document.createElement("p");
  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "confirm-booking";
  submit.textContent = "Confirm booking";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  close.addEventListener("click", () => overlay.remove());

  const loadTimes = async () => {
    times.replaceChildren();
    message.textContent = "Loading available times…";
    try {
      const result = await getDoctorAvailability(doctor.id, date.value);
      result.availableTimes.forEach(slot => {
        const start = slot.split("-")[0].trim();
        times.add(new Option(slot, start));
      });
      message.textContent = result.availableTimes.length ? "" : "No available times for this date.";
    } catch (error) {
      message.textContent = error.message;
    }
  };
  date.addEventListener("change", loadTimes);
  submit.addEventListener("click", async () => {
    if (!date.value || !times.value) {
      message.textContent = "Choose a date and available time.";
      return;
    }
    try {
      await bookAppointment({
        doctorId: doctor.id,
        appointmentTime: `${date.value}T${times.value}:00`
      });
      overlay.remove();
      alert("Appointment booked successfully.");
    } catch (error) {
      message.textContent = error.message;
    }
  });

  overlay.append(heading, patient, date, times, message, submit, close);
  document.body.append(overlay);
  void loadTimes();

  if (event?.clientX != null) {
    const ripple = document.createElement("span");
    ripple.className = "ripple-overlay active";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.append(ripple);
    window.setTimeout(() => ripple.remove(), 1100);
  }
}

function localDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

window.openModal = openModal;
