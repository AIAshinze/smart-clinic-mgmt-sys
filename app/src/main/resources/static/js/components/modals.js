export function openModal(dialog, focusTarget) {
  if (!(dialog instanceof HTMLDialogElement)) {
    throw new TypeError("openModal expects a dialog element");
  }
  if (!dialog.open) dialog.showModal();
  focusTarget?.focus();
}

export function closeModal(dialog) {
  if (dialog instanceof HTMLDialogElement && dialog.open) {
    dialog.close();
  }
}
