export function renderFooter() {
  const footer = document.getElementById("footer");
  if (!footer) return;
  const note = document.createElement("p");
  note.textContent = "SmartCare helps clinics coordinate care. For emergencies, contact local emergency services.";
  footer.replaceChildren(note);
}
