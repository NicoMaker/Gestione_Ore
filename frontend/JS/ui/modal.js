// ==================== MODALI & ALERT ====================
function showModal(title, message, confirmAction) {
  if (!modal) return;

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  currentAction = confirmAction;
  modal.classList.remove("hidden");
}
function hideModal() {
  if (!modal) return;

  modal.classList.add("hidden");
  currentAction = null;
}
function handleModalConfirm() {
  if (currentAction) {
    currentAction();
  }
  hideModal();
}
function showAlert(message, type = "success") {
  if (!alert) return;

  alertMessage.textContent = message;
  alert.className = `alert alert-${type}`;
  alert.classList.remove("hidden");

  // Auto hide after 5 seconds
  setTimeout(() => {
    hideAlert();
  }, 5000);
}
function hideAlert() {
  if (!alert) return;
  alert.classList.add("hidden");
}
