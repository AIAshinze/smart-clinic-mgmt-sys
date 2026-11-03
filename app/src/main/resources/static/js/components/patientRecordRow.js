export function createPatientRecordRow(appointment, onViewPrescription) {
  const row = document.createElement("tr");
  const values = [
    new Date(appointment.appointmentTime).toLocaleDateString(),
    appointment.id,
    appointment.patientId
  ];
  values.forEach(value => {
    const cell = document.createElement("td");
    cell.textContent = value ?? "";
    row.append(cell);
  });
  const actionCell = document.createElement("td");
  if (onViewPrescription) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "button button-outline";
    action.textContent = "View prescription";
    action.addEventListener("click", () => onViewPrescription(appointment));
    actionCell.append(action);
  }
  row.append(actionCell);
  return row;
}
