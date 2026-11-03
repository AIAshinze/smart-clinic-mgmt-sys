export function getAppointments(appointment, onPrescription) {
  const row = document.createElement("tr");
  const values = [
    appointment.patientName,
    appointment.doctorName,
    new Date(appointment.appointmentTime).toLocaleDateString(),
    new Date(appointment.appointmentTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  ];
  values.forEach(value => {
    const cell = document.createElement("td");
    cell.textContent = value ?? "";
    row.append(cell);
  });
  const actionCell = document.createElement("td");
  if (appointment.status === 0 && onPrescription) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "button button-primary";
    action.textContent = "Add prescription";
    action.addEventListener("click", () => onPrescription(appointment));
    actionCell.append(action);
  } else {
    actionCell.textContent = appointment.status === 1 ? "Completed" : "";
  }
  row.append(actionCell);
  return row;
}
