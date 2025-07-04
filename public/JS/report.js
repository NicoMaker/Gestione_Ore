// Global variables
let currentClientId = null
let currentEditingId = null
let currentConfirmAction = null

// DOM elements
const clientName = document.getElementById("client-name")
const clientStatus = document.getElementById("client-status")
const clientEmail = document.getElementById("client-email")
const clientAddress = document.getElementById("client-address")
const clientPurchasedHours = document.getElementById("client-purchased-hours")
const clientUsedHours = document.getElementById("client-used-hours")
const clientRemainingHours = document.getElementById("client-remaining-hours")
const clientUsagePercentage = document.getElementById("client-usage-percentage")
const progressFill = document.getElementById("progress-fill")
const totalInterventions = document.getElementById("total-interventions")
const tabellaInterventi = document.getElementById("tabella-interventi")

// Modals
const editModal = document.getElementById("edit-modal")
const editForm = document.getElementById("edit-form")
const editTipoServizio = document.getElementById("edit-tipo-servizio")
const editOreUtilizzate = document.getElementById("edit-ore-utilizzate")

const confirmModal = document.getElementById("confirm-modal")
const confirmTitle = document.getElementById("confirm-title")
const confirmMessage = document.getElementById("confirm-message")
const confirmYes = document.getElementById("confirm-yes")
const confirmNo = document.getElementById("confirm-no")

// Alert
const alert = document.getElementById("alert")
const alertMessage = document.getElementById("alert-message")
const alertClose = document.getElementById("alert-close")

// Navigation
const hamburger = document.querySelector(".hamburger")
const navMenu = document.querySelector(".nav-menu")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    // Get client ID from URL
    const pathParts = window.location.pathname.split("/")
    currentClientId = pathParts[pathParts.length - 1]

    if (currentClientId && !isNaN(currentClientId)) {
        loadClientReport()
    } else {
        showAlert("ID cliente non valido", "error")
    }

    initializeEventListeners()
})

// Event listeners
function initializeEventListeners() {
    // Navigation
    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active")
            navMenu.classList.toggle("active")
        })
    }

    // Edit form
    if (editForm) {
        editForm.addEventListener("submit", handleEditSubmit)
    }

    // Confirm modal
    if (confirmYes) confirmYes.addEventListener("click", handleConfirmYes)
    if (confirmNo) confirmNo.addEventListener("click", hideConfirmModal)

    // Alert
    if (alertClose) alertClose.addEventListener("click", hideAlert)

    // Close modals on outside click
    if (editModal) {
        editModal.addEventListener("click", (e) => {
            if (e.target === editModal) {
                hideEditModal()
            }
        })
    }

    if (confirmModal) {
        confirmModal.addEventListener("click", (e) => {
            if (e.target === confirmModal) {
                hideConfirmModal()
            }
        })
    }
}

// Load client report
async function loadClientReport() {
    try {
        const response = await fetch(`/api/report_cliente/${currentClientId}`)
        const data = await response.json()

        if (response.ok) {
            updateClientInfo(data)
            updateInterventionsTable(data.interventi)
        } else {
            showAlert(data.error || "Errore nel caricamento del report", "error")
        }
    } catch (error) {
        console.error("Error loading report:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Update client info
function updateClientInfo(data) {
    const { cliente, totaleUsato, percentualeUtilizzo } = data

    // Update client details
    if (clientName) clientName.textContent = cliente.ragione_sociale || "Cliente senza nome"
    if (clientEmail) clientEmail.textContent = cliente.email || "-"
    if (clientAddress) clientAddress.textContent = cliente.indirizzo || "-"
    if (clientPurchasedHours) clientPurchasedHours.textContent = cliente.ore_acquistate.toFixed(1)
    if (clientUsedHours) clientUsedHours.textContent = totaleUsato.toFixed(1)
    if (clientRemainingHours) clientRemainingHours.textContent = cliente.ore_residue.toFixed(1)
    if (clientUsagePercentage) clientUsagePercentage.textContent = percentualeUtilizzo + "%"

    // Update status badge
    if (clientStatus) {
        clientStatus.className = "status-badge"
        if (cliente.ore_residue > 5) {
            clientStatus.classList.add("active")
            clientStatus.textContent = "Attivo"
        } else if (cliente.ore_residue > 0) {
            clientStatus.classList.add("warning")
            clientStatus.textContent = "Attenzione"
        } else {
            clientStatus.classList.add("danger")
            clientStatus.textContent = "Esaurito"
        }
    }

    // Update progress bar
    if (progressFill) {
        progressFill.style.width = percentualeUtilizzo + "%"
    }
}

// Update interventions table
function updateInterventionsTable(interventi) {
    if (!tabellaInterventi) return

    const tbody = tabellaInterventi.querySelector("tbody")
    tbody.innerHTML = ""

    if (totalInterventions) {
        totalInterventions.textContent = interventi.length
    }

    if (interventi.length === 0) {
        const row = document.createElement("tr")
        row.innerHTML = `
      <td colspan="4" style="text-align: center; color: var(--gray-500); padding: 2rem;">
        Nessun intervento registrato
      </td>
    `
        tbody.appendChild(row)
        return
    }

    interventi.forEach((intervento) => {
        const dataFormatted = new Date(intervento.data_intervento).toLocaleDateString("it-IT", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })

        const row = document.createElement("tr")
        row.innerHTML = `
      <td class="date-cell">${dataFormatted}</td>
      <td>${intervento.tipo_servizio || "-"}</td>
      <td class="hours-cell">${intervento.ore_utilizzate.toFixed(1)}</td>
      <td class="no-print">
        <div class="action-buttons">
          <button type="button" class="btn btn-secondary btn-sm" onclick="editIntervento(${intervento.id}, '${intervento.tipo_servizio || ""}', ${intervento.ore_utilizzate})">
            Modifica
          </button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteIntervento(${intervento.id})">
            Elimina
          </button>
        </div>
      </td>
    `
        tbody.appendChild(row)
    })

    // Add total row
    const totalUsed = interventi.reduce((acc, int) => acc + int.ore_utilizzate, 0)
    const totalRow = document.createElement("tr")
    totalRow.style.fontWeight = "bold"
    totalRow.style.backgroundColor = "var(--gray-50)"
    totalRow.innerHTML = `
    <td>TOTALE</td>
    <td></td>
    <td class="hours-cell">${totalUsed.toFixed(1)}</td>
    <td class="no-print"></td>
  `
    tbody.appendChild(totalRow)
}

// Edit intervention
function editIntervento(id, tipoServizio, oreUtilizzate) {
    currentEditingId = id
    if (editTipoServizio) editTipoServizio.value = tipoServizio
    if (editOreUtilizzate) editOreUtilizzate.value = oreUtilizzate
    showEditModal()
}

// Handle edit form submit
async function handleEditSubmit(e) {
    e.preventDefault()

    const tipoServizio = editTipoServizio.value.trim()
    const oreUtilizzate = Number.parseFloat(editOreUtilizzate.value)

    if (!tipoServizio) {
        showAlert("Tipo servizio è obbligatorio", "error")
        return
    }

    if (!oreUtilizzate || oreUtilizzate <= 0) {
        showAlert("Ore utilizzate deve essere maggiore di 0", "error")
        return
    }

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
        })

        const result = await response.json()

        if (response.ok) {
            showAlert("Intervento aggiornato con successo", "success")
            hideEditModal()
            loadClientReport()
        } else {
            showAlert(result.error || "Errore nell'aggiornamento dell'intervento", "error")
        }
    } catch (error) {
        console.error("Error updating intervention:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Delete intervention
function deleteIntervento(id) {
    showConfirmModal("Conferma Eliminazione", "Sei sicuro di voler eliminare questo intervento?", () =>
        performDeleteIntervento(id),
    )
}

// Perform delete intervention
async function performDeleteIntervento(id) {
    try {
        const response = await fetch(`/api/interventi/${id}`, {
            method: "DELETE",
        })

        const result = await response.json()

        if (response.ok) {
            showAlert("Intervento eliminato con successo", "success")
            loadClientReport()
        } else {
            showAlert(result.error || "Errore nell'eliminazione dell'intervento", "error")
        }
    } catch (error) {
        console.error("Error deleting intervention:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Delete all interventions
function eliminaTuttiInterventi() {
    showConfirmModal(
        "Conferma Eliminazione Totale",
        "Sei sicuro di voler eliminare TUTTI gli interventi di questo cliente?",
        () => performDeleteAllInterventions(),
    )
}

// Perform delete all interventions
async function performDeleteAllInterventions() {
    try {
        const response = await fetch(`/api/clienti/${currentClientId}/interventi`, {
            method: "DELETE",
        })

        const result = await response.json()

        if (response.ok) {
            showAlert("Tutti gli interventi sono stati eliminati", "success")
            loadClientReport()
        } else {
            showAlert(result.error || "Errore nell'eliminazione degli interventi", "error")
        }
    } catch (error) {
        console.error("Error deleting all interventions:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Export report
function esportaReport() {
    window.print()
}

// Modal functions
function showEditModal() {
    if (editModal) {
        editModal.classList.remove("hidden")
    }
}

function hideEditModal() {
    if (editModal) {
        editModal.classList.add("hidden")
    }
    currentEditingId = null
}

function showConfirmModal(title, message, confirmAction) {
    if (!confirmModal) return

    if (confirmTitle) confirmTitle.textContent = title
    if (confirmMessage) confirmMessage.textContent = message
    currentConfirmAction = confirmAction
    confirmModal.classList.remove("hidden")
}

function hideConfirmModal() {
    if (confirmModal) {
        confirmModal.classList.add("hidden")
    }
    currentConfirmAction = null
}

function handleConfirmYes() {
    if (currentConfirmAction) {
        currentConfirmAction()
    }
    hideConfirmModal()
}

// Alert functions
function showAlert(message, type = "success") {
    if (!alert) return

    if (alertMessage) alertMessage.textContent = message
    alert.className = `alert alert-${type}`
    alert.classList.remove("hidden")

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideAlert()
    }, 5000)
}

function hideAlert() {
    if (alert) {
        alert.classList.add("hidden")
    }
}
