export function selectRole(role) {
  if (!["admin", "doctor", "patient"].includes(role)) {
    throw new TypeError("Unsupported clinic account type");
  }
  localStorage.setItem("userRole", role);
  window.location.assign("/");
}

export function renderContent() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");
  if (!token || !["admin", "doctor", "patient"].includes(role)) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.assign("/");
  }
}
