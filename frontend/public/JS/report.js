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
async function loadClientReport() {
  try {
    const response = await fetch(`/api/report_cliente/${currentClientId}`);
    const data = await response.json();

    if (response.ok) {
      clientData = data; // Store globally
      updateClientInfo(data);
      updateInterventionsTable(data.interventi);
    } else {
      showAlert(data.error || "Errore nel caricamento del report", "error");
    }
  } catch (error) {
    console.error("Error loading report:", error);
    showAlert("Errore di connessione", "error");
  }
}

// Update client info
function updateClientInfo(data) {
  const { cliente, totaleUsato, percentualeUtilizzo } = data;

  // ✅ Aggiorna il titolo della pagina
  document.title = `Report Cliente ${cliente.ragione_sociale} - Assistenza`;

  // Update client details
  if (clientName)
    clientName.textContent = cliente.ragione_sociale || "Cliente senza nome";
  if (clientEmail) clientEmail.textContent = cliente.email || "-";
  if (clientAddress) clientAddress.textContent = cliente.indirizzo || "-";
  if (clientPurchasedHours)
    clientPurchasedHours.textContent = cliente.ore_acquistate.toFixed(1);
  if (clientUsedHours) clientUsedHours.textContent = totaleUsato.toFixed(1);
  if (clientRemainingHours)
    clientRemainingHours.textContent = cliente.ore_residue.toFixed(1);
  if (clientUsagePercentage)
    clientUsagePercentage.textContent = percentualeUtilizzo + "%";

  // Update status badge
  if (clientStatus) {
    clientStatus.className = "status-badge";

    const percentuale =
      (100 * (cliente.ore_acquistate - cliente.ore_residue)) /
      cliente.ore_acquistate;
    const percentualeText = percentuale.toFixed(1) + "%";

    switch (true) {
      case percentuale <= 70:
        clientStatus.classList.add("active");
        clientStatus.textContent = "Attivo)";
        break;
      case percentuale <= 85:
        clientStatus.classList.add("warning");
        clientStatus.textContent = "Attivo - Attenzione )";
        break;
      case percentuale < 100:
        clientStatus.classList.add("danger");
        clientStatus.textContent = "Attivo - Critico)";
        break;
      default:
        clientStatus.classList.add("danger");
        clientStatus.textContent = "Esaurito)";
        break;
    }
  }

  // Update progress bar
  if (progressFill) {
    progressFill.style.width = percentualeUtilizzo + "%";
  }
}

// Update interventions table
function updateInterventionsTable(interventi) {
  interventiList = interventi;
  if (!tabellaInterventi) return;

  const tbody = tabellaInterventi.querySelector("tbody");
  tbody.innerHTML = "";

  if (totalInterventions) {
    totalInterventions.textContent = interventi.length;
  }

  if (interventi.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td colspan="4" style="text-align: center; color: var(--gray-500); padding: 2rem;">
                Nessun intervento registrato
            </td>
        `;
    tbody.appendChild(row);
    return;
  }

  interventi.forEach((intervento) => {
    const dataFormatted = new Date(
      intervento.data_intervento,
    ).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="date-cell">${dataFormatted}</td>
            <td>${intervento.tipo_servizio || "-"}</td>
            <td class="hours-cell">${intervento.ore_utilizzate.toFixed(1)}</td>
            <td class="no-print">
                <div class="action-buttons">
                    <button type = "button" class="btn btn-primary btn-sm" onclick = "Modifica(${intervento.id})" >
                        Modifica
                    </button >
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteIntervento(${intervento.id})">
                        Elimina
                    </button>
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });

  // Add total row
  const totalUsed = interventi.reduce(
    (acc, int) => acc + int.ore_utilizzate,
    0,
  );
  const totalRow = document.createElement("tr");
  totalRow.style.fontWeight = "bold";
  totalRow.style.backgroundColor = "var(--gray-50)";
  totalRow.innerHTML = `
        <td>TOTALE</td>
        <td></td>
        <td class="hours-cell">${totalUsed.toFixed(1)}</td>
        <td class="no-print"></td>
    `;
  tbody.appendChild(totalRow);
}

// Aggiorna la select combo-interventi con tutti gli interventi
function updateComboInterventi(interventi) {
  if (!comboInterventi) return;
  comboInterventi.innerHTML =
    '<option value="">-- Tutti gli interventi --</option>';
  interventi.forEach((i) => {
    const option = document.createElement("option");
    option.value = i.id;
    option.textContent = `${i.tipo_servizio || "-"} (${new Date(i.data_intervento).toLocaleDateString("it-IT")})`;
    comboInterventi.appendChild(option);
  });
}

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
function updateModalHoursInfo(interventoId, currentHours) {
  if (!clientData) return;

  const { cliente, interventi } = clientData;

  const otherInterventionsTotal = interventi
    .filter((i) => i.id !== interventoId)
    .reduce((acc, i) => acc + i.ore_utilizzate, 0);

  const maxAvailableHours = cliente.ore_acquistate - otherInterventionsTotal;

  // Se gli elementi DOM non esistono, li saltiamo
  if (modalTotalHours)
    modalTotalHours.textContent = cliente.ore_acquistate.toFixed(1);
  if (modalUsedHours)
    modalUsedHours.textContent = otherInterventionsTotal.toFixed(1);
  if (modalMaxHours) modalMaxHours.textContent = maxAvailableHours.toFixed(1);
  if (modalCurrentHours)
    modalCurrentHours.textContent = currentHours.toFixed(1);

  // Aggiungiamo questa riga per compatibilità:
  if (editOreUtilizzate) {
    editOreUtilizzate.max = maxAvailableHours;
    editOreUtilizzate.dataset.maxHours = maxAvailableHours; // 👈 usato per validazione
  }
}

// Validate hours input in real-time
function validateHoursInput() {
  if (!editOreUtilizzate || !currentEditingId || !clientData) return;

  const inputValue = Number.parseFloat(editOreUtilizzate.value) || 0;
  const maxHours = Number.parseFloat(modalMaxHours.textContent) || 0;
  const originalHours = currentInterventoData?.ore_utilizzate || 0;
  const allowedMax = maxHours + originalHours;

  // Rimuove messaggi precedenti
  const existingMsg = editOreUtilizzate.parentNode.querySelector(
    ".validation-message",
  );
  if (existingMsg) existingMsg.remove();

  editOreUtilizzate.classList.remove(
    "input-error",
    "input-warning",
    "input-success",
  );
  if (saveBtn) saveBtn.disabled = false;

  let message = "";
  let messageClass = "";

  if (inputValue <= 0) {
    message = "Le ore devono essere maggiori di 0";
    messageClass = "error";
    editOreUtilizzate.classList.add("input-error");
    if (saveBtn) saveBtn.disabled = true;
  } else if (inputValue > allowedMax) {
    message = `ERRORE: Massimo ${allowedMax.toFixed(1)} ore disponibili`;
    messageClass = "error";
    editOreUtilizzate.classList.add("input-error");
    if (saveBtn) saveBtn.disabled = true;
  } else if (inputValue > maxHours * 0.9) {
    message = `Attenzione: rimangono ${(maxHours - inputValue).toFixed(1)} ore`;
    messageClass = "warning";
    editOreUtilizzate.classList.add("input-warning");
  } else {
    messageClass = "success";
    editOreUtilizzate.classList.add("input-success");
  }

  if (message) {
    const msg = document.createElement("div");
    msg.className = `validation-message ${messageClass}`;
    msg.textContent = message;
    editOreUtilizzate.parentNode.appendChild(msg);
  }
}

// FUNZIONE SUBMIT CORRETTA
async function handleEditSubmit(e) {
  e.preventDefault();

  // Recupera ID intervento da variabile o dataset
  if (!currentEditingId) {
    const idFromDom = editForm?.dataset?.interventoId;
    if (idFromDom) {
      currentEditingId = parseInt(idFromDom);
    } else {
      showAlert("Errore: ID intervento non trovato", "error");
      return;
    }
  }

  // Raccoglie i dati dal form
  const tipoServizio = editTipoServizio?.value.trim() || "";
  let oreUtilizzate = editOreUtilizzate?.value.trim().replace(",", ".") || "0";
  oreUtilizzate = Number.parseFloat(oreUtilizzate);

  // Recupera il massimo consentito (impostato in updateModalHoursInfo)
  const maxHours = Number.parseFloat(
    editOreUtilizzate?.dataset?.maxHours || "0",
  );
  const originalHours = currentInterventoData?.ore_utilizzate || 0;
  const allowedMax = maxHours + originalHours;

  // Validazioni
  if (!tipoServizio) {
    showAlert("Il tipo servizio è obbligatorio", "error");
    return;
  }

  if (!oreUtilizzate || oreUtilizzate <= 0) {
    showAlert("Le ore devono essere maggiori di 0", "error");
    return;
  }

  if (oreUtilizzate > allowedMax) {
    showAlert(
      `Ore eccedenti! Massimo disponibile: ${allowedMax.toFixed(1)} ore`,
      "error",
    );
    return;
  }

  // Invia la richiesta al backend
  try {
    const response = await fetch(`/api/interventi/${currentEditingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipo_servizio: tipoServizio,
        ore_utilizzate: oreUtilizzate,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showAlert("✅ Intervento aggiornato con successo!", "success");
      hideEditModal();
      loadClientReport();
    } else {
      showAlert(result.error || "Errore nel salvataggio", "error");
    }
  } catch (error) {
    console.error("Errore di rete:", error);
    showAlert("Errore di connessione", "error");
  }
}

// Delete intervention
function deleteIntervento(id) {
  // Cerca l'intervento corrente tra i dati caricati
  const intervento = clientData?.interventi?.find((i) => i.id === id);
  const nomeIntervento = intervento?.tipo_servizio || "intervento sconosciuto";

  showConfirmModal(
    "Conferma Eliminazione",
    `Sei sicuro di voler eliminare l'intervento: {nomeIntervento}?`,
    () => performDeleteIntervento(id),
  );
}

async function performDeleteIntervento(id) {
  try {
    const response = await fetch(`/api/interventi/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (response.ok) {
      showAlert("Intervento eliminato con successo", "success");
      loadClientReport();
    } else {
      showAlert(
        result.error || "Errore nell'eliminazione dell'intervento",
        "error",
      );
    }
  } catch (error) {
    console.error("Error deleting intervention:", error);
    showAlert("Errore di connessione", "error");
  }
}

function eliminaTuttiInterventi() {
  showConfirmModal(
    "Conferma Eliminazione Totale",
    "Sei sicuro di voler eliminare TUTTI gli interventi di questo cliente?",
    () => performDeleteAllInterventions(),
  );
}

async function performDeleteAllInterventions() {
  try {
    const response = await fetch(`/api/clienti/${currentClientId}/interventi`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (response.ok) {
      showAlert("Tutti gli interventi sono stati eliminati", "success");
      loadClientReport();
    } else {
      showAlert(
        result.error || "Errore nell'eliminazione degli interventi",
        "error",
      );
    }
  } catch (error) {
    console.error("Error deleting all interventions:", error);
    showAlert("Errore di connessione", "error");
  }
}

function esportaReport() {
  window.print();
}

// Modal functions
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

// Alert functions
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

async function Modifica(interventoId) {
  try {
    console.log("🛠️ Modifica intervento ID:", interventoId);

    const response = await fetch(`/api/interventi/${interventoId}`);
    const data = await response.json();

    if (response.ok) {
      currentEditingId = interventoId;
      currentInterventoData = data.intervento;

      // Popola i campi nel modal
      if (editTipoServizio)
        editTipoServizio.value = data.intervento.tipo_servizio || "";
      if (editOreUtilizzate)
        editOreUtilizzate.value = data.intervento.ore_utilizzate;

      // Salva ID anche come attributo nel DOM (backup)
      if (editForm) {
        editForm.dataset.interventoId = interventoId;
      }

      // Calcola info ore
      updateModalHoursInfo(interventoId, data.intervento.ore_utilizzate);

      showEditModal();
    } else {
      showAlert(
        data.error || "Errore nel caricamento dell'intervento",
        "error",
      );
    }
  } catch (error) {
    console.error("Errore caricamento intervento:", error);
    showAlert("Errore di connessione", "error");
  }
}

function showEditModal() {
  if (editModal) {
    editModal.classList.remove("hidden");
  }
}
