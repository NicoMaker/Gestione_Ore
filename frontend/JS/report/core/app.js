// ============= REPORT · STATO GLOBALE, DOM & BOOTSTRAP =============
// Global variables
let currentClientId = null;
let currentEditingId = null;
let currentConfirmAction = null;
let clientData = null;
let currentInterventoData = null;

// DOM elements
const clientName = document.getElementById("client-name");
const clientStatus = document.getElementById("client-status");
const clientEmail = document.getElementById("client-email");
const clientAddress = document.getElementById("client-address");
const clientPurchasedHours = document.getElementById("client-purchased-hours");
const clientUsedHours = document.getElementById("client-used-hours");
const clientRemainingHours = document.getElementById("client-remaining-hours");
const clientUsagePercentage = document.getElementById(
  "client-usage-percentage",
);
const progressFill = document.getElementById("progress-fill");
const totalInterventions = document.getElementById("total-interventions");
const tabellaInterventi = document.getElementById("tabella-interventi");
const searchInterventiInput = document.getElementById("search-interventi");
const searchInterventoCombo = document.getElementById(
  "search-intervento-combo",
);
const comboInterventi = document.getElementById("combo-interventi");
let interventiList = [];

// Modals
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editTipoServizio = document.getElementById("edit-tipo-servizio");
const editOreUtilizzate = document.getElementById("edit-ore-utilizzate");
const saveBtn = document.getElementById("save-btn");

// Modal info elements
const modalTotalHours = document.getElementById("modal-total-hours");
const modalUsedHours = document.getElementById("modal-used-hours");
const modalMaxHours = document.getElementById("modal-max-hours");
const modalCurrentHours = document.getElementById("modal-current-hours");

const confirmModal = document.getElementById("confirm-modal");
const confirmTitle = document.getElementById("confirm-title");
const confirmMessage = document.getElementById("confirm-message");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

// Alert
const alert = document.getElementById("alert");
const alertMessage = document.getElementById("alert-message");
const alertClose = document.getElementById("alert-close");

// Navigation
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Get client ID from URL
  const pathParts = window.location.pathname.split("/");
  currentClientId = pathParts[pathParts.length - 1];

  if (currentClientId && !isNaN(currentClientId)) {
    loadClientReport();
  } else {
    showAlert("ID cliente non valido", "error");
  }

  initializeEventListeners();
});

// Event listeners
function initializeEventListeners() {
  // Navigation
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
    });
  }

  // Edit form - RIMUOVI DUPLICATO
  if (editForm) {
    editForm.addEventListener("submit", handleEditSubmit);
  }

  // Real-time validation for hours input
  if (editOreUtilizzate) {
    editOreUtilizzate.addEventListener("input", validateHoursInput);
  }

  // Confirm modal
  if (confirmYes) confirmYes.addEventListener("click", handleConfirmYes);
  if (confirmNo) confirmNo.addEventListener("click", hideConfirmModal);

  // Alert
  if (alertClose) alertClose.addEventListener("click", hideAlert);

  // Close modals on outside click
  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) {
        hideEditModal();
      }
    });
  }

  if (confirmModal) {
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) {
        hideConfirmModal();
      }
    });
  }
}

// Load client report

// Update client info

// Update interventions table

// Aggiorna la select combo-interventi con tutti gli interventi

// Ricerca interventi per nome
if (searchInterventiInput) {
  searchInterventiInput.addEventListener("input", function () {
    const value = this.value.toLowerCase();
    // Usa sempre la lista completa come base
    if (!value) {
      updateInterventionsTable(clientData ? clientData.interventi : []);
      return;
    }
    const baseList = clientData ? clientData.interventi : [];
    const filtered = baseList.filter((i) =>
      (i.tipo_servizio || "").toLowerCase().includes(value),
    );
    updateInterventionsTable(filtered);
  });
}

// FUNZIONE CORRETTA - Aggiorna le informazioni ore nel modal

// Validate hours input in real-time

// FUNZIONE SUBMIT CORRETTA

// Delete intervention

// Modal functions

// Alert functions
