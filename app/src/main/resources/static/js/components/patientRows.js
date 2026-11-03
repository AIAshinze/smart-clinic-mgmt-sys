export function createPatientRow(patient, appointmentId, onPrescription) {
  const row = document.createElement("tr");
  [patient.id, patient.name, patient.phone, patient.email].forEach(value => {
    const cell = document.createElement("td");
    cell.textContent = value ?? "";
    row.append(cell);
  });
  const actionCell = document.createElement("td");
  if (onPrescription) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "button button-primary";
    action.textContent = "Add prescription";
    action.addEventListener("click", () => onPrescription(appointmentId, patient));
    actionCell.append(action);
  }
  row.append(actionCell);
  return row;
}
