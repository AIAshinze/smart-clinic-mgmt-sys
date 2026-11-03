export function createDoctorCard(doctor, { role, onBook, onDelete } = {}) {
  const card = document.createElement("article");
  card.className = "doctor-card";

  const name = document.createElement("h3");
  name.textContent = doctor.name;
  const specialty = document.createElement("p");
  specialty.className = "muted";
  specialty.textContent = doctor.specialty;
  const email = document.createElement("p");
  email.textContent = doctor.email;
  const availability = document.createElement("p");
  availability.textContent = `Availability: ${(doctor.availableTimes || []).join(", ") || "Not listed"}`;

  const details = document.createElement("div");
  details.append(name, specialty, email, availability);
  card.append(details);

  if (role === "admin" || role === "patient" || !role) {
    const actions = document.createElement("div");
    actions.className = "card-actions";
    const action = document.createElement("button");
    action.type = "button";
    if (role === "admin") {
      action.textContent = "Remove doctor";
      action.className = "button button-danger";
      action.addEventListener("click", () => onDelete?.(doctor));
    } else {
      action.textContent = role === "patient" ? "Book appointment" : "Sign in to book";
      action.className = "button button-primary";
      action.addEventListener("click", () => onBook?.(doctor));
    }
    actions.append(action);
    card.append(actions);
  }
  return card;
}
