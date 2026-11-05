function renderHeader() {
  const header = document.getElementById("header");
  if (!header) return;

  const path = window.location.pathname;
  if (path === "/" || path === "/index.html") {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    header.replaceChildren();
    return;
  }
  if (document.body.dataset.token) {
    localStorage.setItem("token", document.body.dataset.token);
    localStorage.setItem("userRole", document.body.dataset.role);
  }

  const role = localStorage.getItem("userRole");
  const token = localStorage.getItem("token");
  if (["admin", "doctor", "loggedPatient"].includes(role) && !token) {
    localStorage.removeItem("userRole");
    alert("Session expired or invalid login. Please log in again.");
    window.location.replace("/");
    return;
  }

  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Main navigation");
  const brand = document.createElement("a");
  brand.className = "logo-title";
  brand.href = "/";
  brand.textContent = "SmartCare Clinic";
  header.append(brand, nav);

  if (role === "admin") {
    const addDoctor = document.createElement("button");
    addDoctor.id = "addDocBtn";
    addDoctor.className = "adminBtn";
    addDoctor.type = "button";
    addDoctor.textContent = "Add Doctor";
    nav.append(addDoctor, createLink("Logout", logout));
  } else if (role === "doctor") {
    nav.append(createLink("Home", "/"), createLink("Logout", logout));
  } else if (role === "loggedPatient") {
    nav.append(
      createLink("Home", "/pages/loggedPatientDashboard.html"),
      createLink("Appointments", "/pages/patientAppointments.html"),
      createLink("Logout", logoutPatient)
    );
  } else {
    const login = document.createElement("button");
    login.id = "patientLogin";
    login.type = "button";
    login.textContent = "Login";
    const signup = document.createElement("button");
    signup.id = "patientSignup";
    signup.type = "button";
    signup.textContent = "Sign Up";
    nav.append(login, signup);
    if (role !== "patient") localStorage.setItem("userRole", "patient");
  }
}

function createLink(label, hrefOrHandler) {
  const link = document.createElement("a");
  link.textContent = label;
  if (typeof hrefOrHandler === "function") {
    link.href = "#";
    link.addEventListener("click", event => {
      event.preventDefault();
      hrefOrHandler();
    });
  } else {
    link.href = hrefOrHandler;
  }
  return link;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  window.location.assign("/");
}

function logoutPatient() {
  localStorage.removeItem("token");
  localStorage.setItem("userRole", "patient");
  window.location.assign("/pages/patientDashboard.html");
}

window.renderHeader = renderHeader;
window.logout = logout;
window.logoutPatient = logoutPatient;
document.addEventListener("DOMContentLoaded", renderHeader);
