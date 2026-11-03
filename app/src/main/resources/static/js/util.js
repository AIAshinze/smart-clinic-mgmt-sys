export function setRole(role) {
  localStorage.setItem("userRole", role);
}

export function getRole() {
  return localStorage.getItem("userRole");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function clearRole() {
  localStorage.removeItem("userRole");
  localStorage.removeItem("token");
}
