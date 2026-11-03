export function renderHeader({ role, onHome, onLogin, onDashboard, onLogout }) {
  const header = document.getElementById("header");
  if (!header) return;
  header.replaceChildren();

  const brand = document.createElement("a");
  brand.className = "brand";
  brand.href = "/";
  brand.textContent = "SmartCare";
  header.append(brand);

  const navigation = document.createElement("nav");
  navigation.setAttribute("aria-label", "Main navigation");
  const home = document.createElement("button");
  home.type = "button";
  home.className = "button button-quiet";
  home.textContent = "Find a doctor";
  home.addEventListener("click", onHome);
  navigation.append(home);

  if (role) {
    const dashboard = document.createElement("button");
    dashboard.type = "button";
    dashboard.className = "button button-quiet";
    dashboard.textContent = "Dashboard";
    dashboard.addEventListener("click", onDashboard);
    const logout = document.createElement("button");
    logout.type = "button";
    logout.className = "button button-outline";
    logout.textContent = "Sign out";
    logout.addEventListener("click", onLogout);
    navigation.append(dashboard, logout);
  } else {
    const login = document.createElement("button");
    login.type = "button";
    login.className = "button button-primary";
    login.textContent = "Sign in";
    login.addEventListener("click", onLogin);
    navigation.append(login);
  }
  header.append(navigation);
}
