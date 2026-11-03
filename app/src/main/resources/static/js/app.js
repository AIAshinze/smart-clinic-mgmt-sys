import { renderHeader } from "./components/header.js";
import { renderFooter } from "./components/footer.js";
import { createDoctorCard } from "./components/doctorCard.js";
import { openModal, closeModal } from "./components/modals.js";
import { loginAccount } from "./services/index.js";
import { getDoctors, getDoctorAvailability, createDoctor, deleteDoctor } from "./services/doctorServices.js";
import { patientSignup, getPatientData, updatePatientProfile, getPatients, deletePatient } from "./services/patientServices.js";
import { bookAppointment, getPatientAppointments, getDoctorAppointments, getAllAppointments, cancelAppointment } from "./services/appointmentRecordService.js";
import { savePrescription, getMyPrescriptions } from "./services/prescriptionServices.js";

const dialog = document.getElementById("app-dialog");
const dialogContent = document.getElementById("dialog-content");
const workspace = document.getElementById("workspace");
const homeView = document.getElementById("home-view");
const workspaceView = document.getElementById("workspace-view");
let toastTimeout;

const currentRole = () => localStorage.getItem("userRole");
const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3500);
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function field(labelText, type, name, required = true) {
  const label = node("label", labelText);
  const input = document.createElement(type === "textarea" ? "textarea" : "input");
  if (type !== "textarea") input.type = type;
  input.name = name;
  input.required = required;
  if (type === "password") input.minLength = 8;
  label.append(input);
  return label;
}

function openDialog() {
  openModal(dialog);
}

function goHome() {
  homeView.hidden = false;
  workspaceView.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goDashboard() {
  homeView.hidden = true;
  workspaceView.hidden = false;
  renderDashboard().catch(error => showToast(error.message, true));
  window.scrollTo({ top: workspaceView.offsetTop, behavior: "smooth" });
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  renderApp();
  goHome();
  showToast("You have signed out.");
}

function renderApp() {
  if (!localStorage.getItem("token")) localStorage.removeItem("userRole");
  renderHeader({
    role: currentRole(),
    onHome: goHome,
    onLogin: () => showAuth("login"),
    onDashboard: goDashboard,
    onLogout: logout
  });
  renderFooter();
  document.getElementById("hero-sign-in").hidden = Boolean(currentRole());
  renderDoctorDirectory().catch(error => {
    document.getElementById("directory-message").textContent = error.message;
    document.getElementById("directory-message").classList.add("error");
  });
  if (currentRole()) goDashboard();
  else goHome();
}

async function renderDoctorDirectory() {
  const message = document.getElementById("directory-message");
  const list = document.getElementById("doctor-list");
  message.textContent = "Loading doctors…";
  message.classList.remove("error");
  const filters = {
    name: document.getElementById("search-doctor").value.trim(),
    time: document.getElementById("filter-time").value,
    specialty: document.getElementById("filter-specialty").value
  };
  const doctors = await getDoctors(filters);
  list.replaceChildren();
  if (!doctors.length) {
    message.textContent = "No doctors match these filters.";
    return;
  }
  message.textContent = `${doctors.length} doctor${doctors.length === 1 ? "" : "s"} available`;
  const specialtySelect = document.getElementById("filter-specialty");
  const selectedSpecialty = specialtySelect.value;
  const specialties = [...new Set(doctors.map(doctor => doctor.specialty))].sort();
  specialtySelect.replaceChildren(new Option("All specialties", ""));
  specialties.forEach(specialty => specialtySelect.add(new Option(specialty, specialty)));
  if (specialties.includes(selectedSpecialty)) specialtySelect.value = selectedSpecialty;
  doctors.forEach(doctor => list.append(createDoctorCard(doctor, {
    role: currentRole(),
    onBook: selected => openBooking(selected).catch(error => showToast(error.message, true)),
    onDelete: selected => removeDoctor(selected)
  })));
}

function showAuth(mode = "login", initialRole = "patient") {
  const form = document.createElement("form");
  form.className = "dialog-form";
  form.id = "auth-form";
  const title = node("h2", mode === "register" ? "Create a patient account" : "Sign in");
  title.id = "dialog-title";
  form.append(title);
  if (mode === "login") {
    const roleLabel = node("label", "Account type");
    const role = document.createElement("select");
    role.name = "role";
    [["patient", "Patient"], ["doctor", "Doctor"], ["admin", "Administrator"]]
      .forEach(([value, name]) => role.add(new Option(name, value)));
    role.value = initialRole;
    roleLabel.append(role);
    form.append(roleLabel);
  } else {
    form.append(
      field("Full name", "text", "name"),
      field("Phone (10 digits)", "tel", "phone"),
      field("Address", "text", "address")
    );
    form.dataset.role = "patient";
  }

  const email = field(mode === "login" && initialRole === "admin" ? "Username" : "Email", "text", "identity");
  const password = field("Password (at least 8 characters)", "password", "password");
  if (mode === "login") password.querySelector("input").minLength = 1;
  form.append(email, password);
  const submit = node("button", mode === "register" ? "Create account" : "Sign in", "button button-primary");
  submit.type = "submit";
  form.append(submit);
  const switchMode = node("button", mode === "register" ? "Already registered? Sign in" : "New patient? Create an account", "button button-quiet");
  switchMode.type = "button";
  switchMode.addEventListener("click", () => showAuth(mode === "register" ? "login" : "register", "patient"));
  form.append(switchMode);
  dialogContent.replaceChildren(form);

  const updateLoginFields = () => {
    const selectedRole = form.elements.role?.value || "patient";
    const input = form.elements.identity;
    const label = input.closest("label");
    label.firstChild.textContent = selectedRole === "admin" ? "Username" : "Email";
    input.type = selectedRole === "admin" ? "text" : "email";
    input.autocomplete = selectedRole === "admin" ? "username" : "email";
  };
  form.elements.role?.addEventListener("change", updateLoginFields);
  updateLoginFields();
  form.addEventListener("submit", event => submitAuth(event, form, mode));
  openDialog();
  form.elements.identity.focus();
}

async function submitAuth(event, form, mode) {
  event.preventDefault();
  const values = new FormData(form);
  const password = values.get("password");
  try {
    if (mode === "register") {
      await patientSignup({
        name: values.get("name"),
        email: values.get("identity"),
        phone: values.get("phone"),
        address: values.get("address"),
        password
      });
      showToast("Account created. Sign in to continue.");
      showAuth("login", "patient");
      return;
    }

    const role = values.get("role");
    const identity = values.get("identity");
    const response = await loginAccount(role, identity, password);
    localStorage.setItem("token", response.token);
    localStorage.setItem("userRole", response.role);
    closeModal(dialog);
    renderApp();
    showToast("Welcome back.");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function openBooking(doctor) {
  if (currentRole() !== "patient") {
    showAuth("login", "patient");
    return;
  }

  const form = document.createElement("form");
  form.className = "dialog-form";
  const title = node("h2", `Book with ${doctor.name}`);
  title.id = "dialog-title";
  form.append(title);
  const dateLabel = field("Appointment date", "date", "date");
  const dateInput = dateLabel.querySelector("input");
  dateInput.min = today();
  dateInput.value = today();
  const timeLabel = node("label", "Available time");
  const times = document.createElement("select");
  times.name = "time";
  times.required = true;
  timeLabel.append(times);
  const message = node("p", "", "status-message");
  const submit = node("button", "Confirm appointment", "button button-primary");
  submit.type = "submit";
  form.append(dateLabel, timeLabel, message, submit);
  dialogContent.replaceChildren(form);

  const loadTimes = async () => {
    times.replaceChildren(new Option("Loading…", ""));
    try {
      const result = await getDoctorAvailability(doctor.id, dateInput.value);
      times.replaceChildren(new Option("Choose a time", ""));
      result.availableTimes.forEach(slot => times.add(new Option(slot, slot.split("-")[0])));
      if (!result.availableTimes.length) message.textContent = "No appointment times are available on this date.";
    } catch (error) {
      times.replaceChildren(new Option("Unavailable", ""));
      message.textContent = error.message;
    }
  };
  dateInput.addEventListener("change", loadTimes);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    submit.disabled = true;
    try {
      await bookAppointment({
        doctorId: doctor.id,
        appointmentTime: `${dateInput.value}T${times.value}:00`
      });
      closeModal(dialog);
      showToast("Appointment booked.");
      goDashboard();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("error");
    } finally {
      submit.disabled = false;
    }
  });
  await loadTimes();
  openDialog();
}

async function renderDashboard() {
  workspace.replaceChildren();
  const role = currentRole();
  if (role === "admin") return renderAdminDashboard();
  if (role === "doctor") return renderDoctorDashboard();
  if (role === "patient") return renderPatientDashboard();
  logout();
}

function dashboardHeading(title, description) {
  const heading = document.createElement("div");
  heading.className = "workspace-heading";
  const content = document.createElement("div");
  content.append(node("p", currentRole().toUpperCase(), "eyebrow"), node("h2", title), node("p", description, "muted"));
  heading.append(content);
  return heading;
}

async function renderAdminDashboard() {
  workspace.append(dashboardHeading("Clinic administration", "Manage the clinic directory, patient accounts, and appointments."));
  const tabs = node("div", undefined, "inline-form");
  const panel = node("div", undefined, "panel");
  workspace.append(tabs, panel);
  const sections = [
    ["Doctors", () => renderAdminDoctors(panel)],
    ["Patients", () => renderAdminPatients(panel)],
    ["Appointments", () => renderAdminAppointments(panel)]
  ];
  sections.forEach(([label, render]) => {
    const button = node("button", label, "button button-outline");
    button.type = "button";
    button.addEventListener("click", () => render().catch(error => showToast(error.message, true)));
    tabs.append(button);
  });
  await renderAdminDoctors(panel);
}

async function renderAdminDoctors(panel) {
  panel.replaceChildren(node("h3", "Doctors"));
  const form = document.createElement("form");
  form.className = "filters";
  form.append(
    field("Name", "text", "name"),
    field("Specialty", "text", "specialty"),
    field("Email", "email", "email"),
    field("Phone (10 digits)", "tel", "phone"),
    field("Temporary password", "password", "password"),
    field("Availability slots (comma separated, HH:mm-HH:mm)", "text", "availableTimes", false)
  );
  const add = node("button", "Add doctor", "button button-primary");
  add.type = "submit";
  form.append(add);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    try {
      await createDoctor({
        ...data,
        availableTimes: data.availableTimes.split(",").map(value => value.trim()).filter(Boolean)
      });
      form.reset();
      showToast("Doctor added.");
      await renderAdminDoctors(panel);
    } catch (error) {
      showToast(error.message, true);
    }
  });
  panel.append(form);
  const doctors = await getDoctors();
  const list = node("div", undefined, "card-grid");
  doctors.forEach(doctor => list.append(createDoctorCard(doctor, {
    role: "admin",
    onDelete: selected => removeDoctor(selected).then(() => renderAdminDoctors(panel))
  })));
  panel.append(list);
}

async function removeDoctor(doctor) {
  if (!window.confirm(`Remove ${doctor.name}? Their future appointments will also be removed.`)) return;
  try {
    await deleteDoctor(doctor.id);
    showToast("Doctor removed.");
    await renderDoctorDirectory();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function renderAdminPatients(panel) {
  panel.replaceChildren(node("h3", "Patient accounts"));
  const patients = await getPatients();
  if (!patients.length) {
    panel.append(node("p", "No patient accounts found.", "muted"));
    return;
  }
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Name", "Email", "Phone", "Address", "Actions"].forEach(text => headerRow.append(node("th", text)));
  head.append(headerRow);
  const body = document.createElement("tbody");
  patients.forEach(patient => {
    const row = document.createElement("tr");
    [patient.name, patient.email, patient.phone, patient.address].forEach(value => row.append(node("td", value)));
    const action = node("td");
    const remove = node("button", "Delete", "button button-danger");
    remove.type = "button";
    remove.addEventListener("click", async () => {
      if (!window.confirm(`Delete patient ${patient.name} and associated appointment history?`)) return;
      await deletePatient(patient.id);
      await renderAdminPatients(panel);
    });
    action.append(remove);
    row.append(action);
    body.append(row);
  });
  table.append(head, body);
  const wrapper = node("div", undefined, "table-wrap");
  wrapper.append(table);
  panel.append(wrapper);
}

async function renderAdminAppointments(panel) {
  panel.replaceChildren(node("h3", "Appointments"));
  const appointments = await getAllAppointments();
  renderAppointmentTable(panel, appointments);
}

function renderAppointmentTable(target, appointments, includePatient = true) {
  if (!appointments.length) {
    target.append(node("p", "No appointments found.", "muted"));
    return;
  }
  const table = document.createElement("table");
  const header = document.createElement("tr");
  (includePatient ? ["Patient", "Doctor", "Date", "Time", "Status"] : ["Doctor", "Date", "Time", "Status"])
    .forEach(value => header.append(node("th", value)));
  const head = document.createElement("thead");
  head.append(header);
  const body = document.createElement("tbody");
  appointments.forEach(appointment => {
    const row = document.createElement("tr");
    const values = [
      ...(includePatient ? [appointment.patientName] : []),
      appointment.doctorName,
      new Date(appointment.appointmentTime).toLocaleDateString(),
      new Date(appointment.appointmentTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      appointment.status === 1 ? "Completed" : "Scheduled"
    ];
    values.forEach(value => row.append(node("td", value)));
    body.append(row);
  });
  table.append(head, body);
  const wrapper = node("div", undefined, "table-wrap");
  wrapper.append(table);
  target.append(wrapper);
}

async function renderDoctorDashboard() {
  workspace.append(dashboardHeading("Your appointments", "Review today's visits and add a prescription after care."));
  const controls = node("form", undefined, "inline-form");
  const date = field("Appointment date", "date", "date");
  date.querySelector("input").value = today();
  const search = field("Find patient", "search", "patientName", false);
  const submit = node("button", "Search", "button button-primary");
  submit.type = "submit";
  controls.append(date, search, submit);
  const list = node("div", undefined, "appointment-list");
  controls.addEventListener("submit", event => {
    event.preventDefault();
    loadDoctorAppointments(list, date.querySelector("input").value, search.querySelector("input").value)
      .catch(error => showToast(error.message, true));
  });
  date.querySelector("input").addEventListener("change", () =>
    loadDoctorAppointments(list, date.querySelector("input").value, search.querySelector("input").value)
      .catch(error => showToast(error.message, true)));
  workspace.append(controls, list);
  await loadDoctorAppointments(list, today());
}

async function loadDoctorAppointments(list, date, patientName = "") {
  list.replaceChildren(node("p", "Loading appointments…", "muted"));
  const appointments = await getDoctorAppointments(date, patientName);
  list.replaceChildren();
  if (!appointments.length) {
    list.append(node("p", "No appointments for this date.", "muted"));
    return;
  }
  appointments.forEach(appointment => {
    const card = node("article", undefined, "appointment-card");
    const details = node("div");
    details.append(
      node("strong", appointment.patientName),
      node("p", `${appointment.patientEmail} · ${appointment.patientPhone}`),
      node("p", `${new Date(appointment.appointmentTime).toLocaleString()} · ${appointment.status === 1 ? "Completed" : "Scheduled"}`)
    );
    card.append(details);
    if (appointment.status === 0) {
      const prescribe = node("button", "Add prescription", "button button-primary");
      prescribe.type = "button";
      prescribe.addEventListener("click", () => openPrescriptionForm(appointment, list, date, patientName));
      card.append(prescribe);
    }
    list.append(card);
  });
}

function openPrescriptionForm(appointment, list, date, patientName) {
  const form = document.createElement("form");
  form.className = "dialog-form";
  const title = node("h2", `Prescription for ${appointment.patientName}`);
  title.id = "dialog-title";
  form.append(title, field("Medication", "text", "medication"), field("Dosage", "text", "dosage"), field("Doctor notes", "textarea", "doctorNotes", false));
  const submit = node("button", "Save prescription", "button button-primary");
  submit.type = "submit";
  form.append(submit);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    try {
      await savePrescription({ ...values, appointmentId: appointment.id });
      closeModal(dialog);
      showToast("Prescription saved.");
      await loadDoctorAppointments(list, date, patientName);
    } catch (error) {
      showToast(error.message, true);
    }
  });
  dialogContent.replaceChildren(form);
  openDialog();
}

async function renderPatientDashboard() {
  workspace.append(dashboardHeading("Your care", "Manage your visits and review prescription history."));
  const layout = node("div", undefined, "workspace-grid");
  const profile = node("section", undefined, "panel");
  profile.append(node("h3", "Your profile"));
  const appointmentsPanel = node("section", undefined, "panel");
  appointmentsPanel.append(node("h3", "Appointments"));
  const prescriptionsPanel = node("section", undefined, "panel");
  prescriptionsPanel.append(node("h3", "Prescription history"));
  layout.append(profile, node("div", undefined, "stack"));
  layout.lastChild.append(appointmentsPanel, prescriptionsPanel);
  workspace.append(layout);

  const patient = await getPatientData();
  const profileForm = document.createElement("form");
  profileForm.className = "stack";
  for (const [label, type, name, value] of [
    ["Name", "text", "name", patient.name],
    ["Phone", "tel", "phone", patient.phone],
    ["Address", "text", "address", patient.address]
  ]) {
    const inputLabel = field(label, type, name);
    inputLabel.querySelector("input").value = value;
    profileForm.append(inputLabel);
  }
  const save = node("button", "Update profile", "button button-primary");
  save.type = "submit";
  profileForm.append(save);
  profileForm.addEventListener("submit", async event => {
    event.preventDefault();
    try {
      await updatePatientProfile(Object.fromEntries(new FormData(profileForm)));
      showToast("Profile updated.");
    } catch (error) {
      showToast(error.message, true);
    }
  });
  profile.append(profileForm);

  const appointments = await getPatientAppointments();
  const appointmentList = node("div", undefined, "appointment-list");
  if (!appointments.length) appointmentList.append(node("p", "You have no appointments yet.", "muted"));
  appointments.forEach(appointment => {
    const card = node("article", undefined, "appointment-card");
    const details = node("div");
    details.append(
      node("strong", appointment.doctorName),
      node("p", new Date(appointment.appointmentTime).toLocaleString()),
      node("p", appointment.status === 1 ? "Completed" : "Scheduled")
    );
    card.append(details);
    if (appointment.status === 0) {
      const cancel = node("button", "Cancel", "button button-danger");
      cancel.type = "button";
      cancel.addEventListener("click", async () => {
        if (!window.confirm("Cancel this appointment?")) return;
        await cancelAppointment(appointment.id);
        showToast("Appointment cancelled.");
        await renderPatientDashboard();
      });
      card.append(cancel);
    }
    appointmentList.append(card);
  });
  appointmentsPanel.append(appointmentList);
  const prescriptions = await getMyPrescriptions();
  if (!prescriptions.length) {
    prescriptionsPanel.append(node("p", "No prescriptions available.", "muted"));
  } else {
    prescriptions.forEach(prescription => {
      const item = node("article", undefined, "appointment-card");
      item.append(node("strong", prescription.medication), node("span", `${prescription.dosage} · ${prescription.doctorNotes || "No additional notes"}`));
      prescriptionsPanel.append(item);
    });
  }
}

document.getElementById("dialog-close").addEventListener("click", () => closeModal(dialog));
dialog.addEventListener("click", event => {
  if (event.target === dialog) closeModal(dialog);
});
document.getElementById("hero-sign-in").addEventListener("click", () => showAuth());
document.getElementById("search-doctor").addEventListener("input", () => renderDoctorDirectory().catch(error => showToast(error.message, true)));
document.getElementById("filter-time").addEventListener("change", () => renderDoctorDirectory().catch(error => showToast(error.message, true)));
document.getElementById("filter-specialty").addEventListener("change", () => renderDoctorDirectory().catch(error => showToast(error.message, true)));
window.addEventListener("clinic:session-expired", () => {
  renderApp();
  showToast("Your session expired. Please sign in again.", true);
});

renderApp();
