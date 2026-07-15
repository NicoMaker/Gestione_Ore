// ============= REPORT · MODALI & ALERT =============
function showEditModal() {
  if (editModal) {
    editModal.classList.remove("hidden");
  }
}
function hideEditModal() {
  if (editModal) {
    editModal.classList.add("hidden");
  }

  // Reset variabili globali
  currentEditingId = null;
  currentInterventoData = null;

  // Pulisce messaggi di validazione
  const validationMsgs = editForm?.querySelectorAll(".validation-message");
  validationMsgs?.forEach((msg) => msg.remove());

  // Reset input tipo servizio
  if (editTipoServizio) {
    editTipoServizio.value = "";
  }

  // Reset input ore utilizzate
  if (editOreUtilizzate) {
    editOreUtilizzate.value = "";
    editOreUtilizzate.classList.remove(
      "input-error",
      "input-warning",
      "input-success",
    );
    editOreUtilizzate.removeAttribute("data-max-hours"); // ← molto importante
  }

  // Reimposta bottone Salva
  if (saveBtn) {
    saveBtn.disabled = false;
  }

  // Rimuove anche eventuale ID dal dataset
  if (editForm && editForm.dataset.interventoId) {
    delete editForm.dataset.interventoId;
  }
}
function showConfirmModal(title, message, confirmAction) {
  if (!confirmModal) return;

  if (confirmTitle) confirmTitle.textContent = title;
  if (confirmMessage) confirmMessage.textContent = message;
  currentConfirmAction = confirmAction;
  confirmModal.classList.remove("hidden");
}
function hideConfirmModal() {
  if (confirmModal) {
    confirmModal.classList.add("hidden");
  }
  currentConfirmAction = null;
}
function handleConfirmYes() {
  if (currentConfirmAction) {
    currentConfirmAction();
  }
  hideConfirmModal();
}
function showAlert(message, type = "success") {
  if (!alert) return;

  if (alertMessage) alertMessage.textContent = message;
  alert.className = `alert alert-${type}`;
  alert.classList.remove("hidden");

  setTimeout(() => {
    hideAlert();
  }, 5000);
}
function hideAlert() {
  if (alert) {
    alert.classList.add("hidden");
  }
}
function showEditModal() {
  if (editModal) {
    editModal.classList.remove("hidden");
  }
}
