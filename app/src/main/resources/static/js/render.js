function selectRole(role) {
  if (!["admin", "doctor", "patient", "loggedPatient"].includes(role)) {
    throw new TypeError("Unsupported clinic account type");
  }
  localStorage.setItem("userRole", role);
}

function renderContent() {
  const token = document.body.dataset.token || localStorage.getItem("token");
  const role = document.body.dataset.role || localStorage.getItem("userRole");
  const path = window.location.pathname;

  if (token) localStorage.setItem("token", token);
  if (role) localStorage.setItem("userRole", role);

  if (path.startsWith("/adminDashboard/") && (!token || role !== "admin")) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.replace("/");
    return;
  }
  if (path.startsWith("/doctorDashboard/") && (!token || role !== "doctor")) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.replace("/");
    return;
  }
  if (path.endsWith("/patientAppointments.html") && (!token || role !== "loggedPatient")) {
    window.location.replace("/pages/patientDashboard.html");
    return;
  }
  if (path.endsWith("/loggedPatientDashboard.html") && (!token || role !== "loggedPatient")) {
    window.location.replace("/pages/patientDashboard.html");
  }
}

window.selectRole = selectRole;
window.renderContent = renderContent;
