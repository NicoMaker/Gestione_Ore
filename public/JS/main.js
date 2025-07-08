// Global variables
let currentAction = null
const editingClientId = null
const originalClientData = {}

// DOM elements
const formCliente = document.getElementById("form-cliente")
const formIntervento = document.getElementById("form-intervento")
const tabellaClienti = document.getElementById("tabella-clienti")
const clienteSelect = document.getElementById("cliente_id")
const oreUtilizzateInput = document.getElementById("ore_utilizzate")
const modal = document.getElementById("modal")
const modalTitle = document.getElementById("modal-title")
const modalMessage = document.getElementById("modal-message")
const modalConfirm = document.getElementById("modal-confirm")
const modalCancel = document.getElementById("modal-cancel")
const alert = document.getElementById("alert")
const alertMessage = document.getElementById("alert-message")
const alertClose = document.getElementById("alert-close")

// Navigation
const hamburger = document.querySelector(".hamburger")
const navMenu = document.querySelector(".nav-menu")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    caricaClienti()
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

    // Forms
    if (formCliente) {
        formCliente.addEventListener("submit", handleClienteSubmit)
    }

    if (formIntervento) {
        formIntervento.addEventListener("submit", handleInterventoSubmit)
    }

    // Real-time validation for intervention hours
    if (oreUtilizzateInput) {
        oreUtilizzateInput.addEventListener("input", validateInterventionHours)
    }

    if (clienteSelect) {
        clienteSelect.addEventListener("change", updateMaxHours)
    }

    // Modal
    if (modalConfirm) modalConfirm.addEventListener("click", handleModalConfirm)
    if (modalCancel) modalCancel.addEventListener("click", hideModal)

    // Alert
    if (alertClose) alertClose.addEventListener("click", hideAlert)

    // Close modal on outside click
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                hideModal()
            }
        })
    }
}

// Update max hours for intervention form
function updateMaxHours() {
    const selectedOption = clienteSelect.selectedOptions[0]
    if (selectedOption && selectedOption.dataset.oreResidue) {
        const maxHours = Number.parseFloat(selectedOption.dataset.oreResidue)
        oreUtilizzateInput.setAttribute("max", maxHours)
        oreUtilizzateInput.setAttribute("title", `Massimo disponibile: ${maxHours.toFixed(1)} ore`)

        // Clear any existing validation if hours are now valid
        if (oreUtilizzateInput.value && Number.parseFloat(oreUtilizzateInput.value) <= maxHours) {
            oreUtilizzateInput.setCustomValidity("")
        }
    } else {
        oreUtilizzateInput.removeAttribute("max")
        oreUtilizzateInput.removeAttribute("title")
    }
}

// Validate intervention hours in real-time
function validateInterventionHours() {
    const selectedOption = clienteSelect.selectedOptions[0]
    const oreUtilizzate = Number.parseFloat(oreUtilizzateInput.value)

    if (!selectedOption || !selectedOption.dataset.oreResidue) {
        oreUtilizzateInput.setCustomValidity("Seleziona prima un cliente")
        return false
    }

    const oreResidue = Number.parseFloat(selectedOption.dataset.oreResidue)

    if (isNaN(oreUtilizzate) || oreUtilizzate <= 0) {
        oreUtilizzateInput.setCustomValidity("Inserisci un numero di ore valido maggiore di 0")
        return false
    }

    if (oreUtilizzate > oreResidue) {
        oreUtilizzateInput.setCustomValidity(`Ore insufficienti. Disponibili: ${oreResidue.toFixed(1)} ore`)
        return false
    }

    oreUtilizzateInput.setCustomValidity("")
    return true
}

// Load clients
async function caricaClienti() {
    try {
        const response = await fetch("/api/clienti")
        const result = await response.json()

        if (response.ok) {
            // ORDINA ALFANUMERICAMENTE (es. Cliente 2 prima di Cliente 10)
            result.sort((a, b) =>
                (a.ragione_sociale || "").localeCompare(b.ragione_sociale || "", undefined, {
                    numeric: true,
                    sensitivity: "base"
                })
            )

            updateClientiTable(result)
            updateClienteSelect(result)
        } else {
            showAlert("Errore nel caricamento dei clienti: " + (result.error || "Errore sconosciuto"), "error")
        }
    } catch (error) {
        console.error("Error loading clients:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Update clients table
function updateClientiTable(clienti) {
    if (!tabellaClienti) return

    const tbody = tabellaClienti.querySelector("tbody")
    tbody.innerHTML = ""

    if (clienti.length === 0) {
        const row = document.createElement("tr")
        row.innerHTML = `
      <td colspan="8" style="text-align: center; color: var(--gray-500); padding: 2rem;">
        Nessun cliente registrato
      </td>
    `
        tbody.appendChild(row)
        return
    }

    clienti.forEach((cliente) => {
        const oreUtilizzate = (cliente.ore_acquistate - cliente.ore_residue).toFixed(1)
        const percentualeUsata = ((cliente.ore_acquistate - cliente.ore_residue) / cliente.ore_acquistate) * 100
        let statoClass = ""

        switch (true) {
            case (cliente.ore_residue <= 0):
                statoClass = "status-danger";
                break;
            case (percentualeUsata <= 70):
                statoClass = "status-success";
                break;
            case (percentualeUsata <= 85):
                statoClass = "status-warning";
                break;
            case (percentualeUsata <= 99.9):
                statoClass = "status-light-danger";
                break;
        }


        const row = document.createElement("tr")
        row.dataset.clienteId = cliente.id
        row.innerHTML = `
      <td>
        <input type="text" value="${cliente.ragione_sociale || ""}" data-field="ragione_sociale" data-original="${cliente.ragione_sociale || ""}">
      </td>
      <td>
        <input type="text" value="${cliente.indirizzo || ""}" data-field="indirizzo" data-original="${cliente.indirizzo || ""}">
      </td>
      <td>
        <input type="email" value="${cliente.email || ""}" data-field="email" data-original="${cliente.email || ""}">
      </td>
      <td>
        <input type="number" step="0.1" value="${cliente.ore_acquistate || 0}" data-field="ore_acquistate" 
               min="${oreUtilizzate}" title="Minimo: ${oreUtilizzate} ore (ore già utilizzate)" data-original="${cliente.ore_acquistate || 0}">
      </td>
      <td class="text-danger">${oreUtilizzate}</td>
      <td class="text-success">${cliente.ore_residue.toFixed(1)}</td>

    <td><p>${percentualeUsata.toFixed(1)}%</p></td>


      <td>
         <span class="status-indicator ${statoClass}" title="Ore residue: ${cliente.ore_residue.toFixed(1)} ore"></span>
      </td>

      <td>
        <div class="action-buttons">
          <button type="button" class="btn btn-success btn-sm" onclick="salvaCliente(${cliente.id}, this)">
            Salva
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="annullaModifiche(${cliente.id}, this)">
            Annulla
          </button>
          <button type="button" class="btn btn-danger btn-sm" onclick="eliminaCliente(${cliente.id})">
            Elimina
          </button>
          <a href="/report_cliente/${cliente.id}" target="_blank" class="btn btn-primary btn-sm">
            Report
          </a>
        </div>
      </td>
    `
        tbody.appendChild(row)

        // Add change listeners to track modifications
        const inputs = row.querySelectorAll("input[data-field]")
        inputs.forEach((input) => {
            input.addEventListener("input", () => markRowAsModified(cliente.id))
        })
    })
}

// Mark row as modified
function markRowAsModified(clienteId) {
    const row = document.querySelector(`tr[data-cliente-id="${clienteId}"]`)
    if (row) {
        row.classList.add("modified")
        const saveBtn = row.querySelector(".btn-success")
        const cancelBtn = row.querySelector(".btn-secondary")
        if (saveBtn) saveBtn.style.display = "inline-flex"
        if (cancelBtn) cancelBtn.style.display = "inline-flex"
    }
}

// Cancel modifications
function annullaModifiche(clienteId, button) {
    const row = button.closest("tr")
    const inputs = row.querySelectorAll("input[data-field]")

    inputs.forEach((input) => {
        input.value = input.dataset.original
    })

    row.classList.remove("modified")
    showAlert("❌ Modifiche annullate", "success");

}

// Update client select
function updateClienteSelect(clienti) {
    if (!clienteSelect) return

    clienteSelect.innerHTML = '<option value="">-- Seleziona Cliente --</option>'

    clienti.forEach((cliente) => {
        const option = document.createElement("option")
        option.value = cliente.id
        option.textContent = `${cliente.ragione_sociale || "Cliente senza nome"} (${cliente.ore_residue.toFixed(1)} ore)`
        option.dataset.oreResidue = cliente.ore_residue
        clienteSelect.appendChild(option)
    })
}

// Handle client form submit
async function handleClienteSubmit(e) {
    e.preventDefault()

    const formData = new FormData(formCliente)

    // Basic validation
    const ragioneSociale = formData.get("ragione_sociale")
    const oreAcquistate = formData.get("ore_acquistate")

    if (!ragioneSociale || ragioneSociale.trim() === "") {
        showAlert("Ragione sociale è obbligatoria", "error")
        return
    }

    if (!oreAcquistate || isNaN(oreAcquistate) || Number.parseFloat(oreAcquistate) <= 0) {
        showAlert("Ore acquistate deve essere un numero maggiore di 0", "error")
        return
    }

    try {
        const response = await fetch("/add_cliente", {
            method: "POST",
            body: formData,
        })

        const result = await response.json()

        if (response.ok) {
            showAlert("✅ Cliente aggiunto con successo", "success")
            formCliente.reset()
            caricaClienti()
        } else {
            showAlert(result.error || "Errore nell'aggiunta del cliente", "error")
        }
    } catch (error) {
        console.error("Error adding client:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Handle intervention form submit
async function handleInterventoSubmit(e) {
    e.preventDefault()

    const formData = new FormData(formIntervento)
    const clienteId = formData.get("cliente_id")
    const tipoServizio = formData.get("tipo_servizio")
    const oreUtilizzate = Number.parseFloat(formData.get("ore_utilizzate"))

    // Comprehensive validation
    if (!clienteId) {
        showAlert("Seleziona un cliente", "error")
        return
    }

    if (!tipoServizio || tipoServizio.trim() === "") {
        showAlert("Tipo servizio è obbligatorio", "error")
        return
    }

    if (!oreUtilizzate || oreUtilizzate <= 0) {
        showAlert("Ore utilizzate deve essere maggiore di 0", "error")
        return
    }

    // Validate against available hours
    if (!validateInterventionHours()) {
        showAlert("Controlla le ore utilizzate", "error")
        return
    }

    const selectedOption = clienteSelect.selectedOptions[0]
    const oreResidue = Number.parseFloat(selectedOption.dataset.oreResidue)

    if (oreUtilizzate > oreResidue) {
        showAlert(`Ore insufficienti. Disponibili: ${oreResidue.toFixed(1)} ore`, "error")
        return
    }

    try {
        const response = await fetch("/add_intervento", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cliente_id: Number.parseInt(clienteId),
                tipo_servizio: tipoServizio.trim(),
                ore_utilizzate: oreUtilizzate,
            }),
        })

        const result = await response.json()

        if (response.ok) {
            showAlert("Intervento registrato con successo", "success")
            formIntervento.reset()
            oreUtilizzateInput.setCustomValidity("")
            caricaClienti()
        } else {
            showAlert(result.error || "Errore nella registrazione dell'intervento", "error")
        }
    } catch (error) {
        console.error("Error adding intervention:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Save client
async function salvaCliente(id, button) {
    const row = button.closest("tr")
    const inputs = row.querySelectorAll("input[data-field]")

    const data = {}
    inputs.forEach((input) => {
        data[input.dataset.field] = input.value
    })

    // Validation
    if (!data.ragione_sociale || data.ragione_sociale.trim() === "") {
        showAlert("Ragione sociale è obbligatoria", "error")
        return
    }

    if (!data.ore_acquistate || isNaN(data.ore_acquistate) || Number.parseFloat(data.ore_acquistate) <= 0) {
        showAlert("Ore acquistate deve essere un numero maggiore di 0", "error")
        return
    }

    // Validazione aggiuntiva: controlla il minimo consentito
    const oreAcquistateInput = row.querySelector('input[data-field="ore_acquistate"]')
    const minOre = Number.parseFloat(oreAcquistateInput.getAttribute("min"))
    const oreAcquistate = Number.parseFloat(data.ore_acquistate)

    if (oreAcquistate < minOre) {
        showAlert(
            `Non puoi impostare ore acquistate (${oreAcquistate}) inferiori alle ore già utilizzate (${minOre}). Minimo consentito: ${minOre} ore.`,
            "error",
        )
        return
    }

    try {
        const response = await fetch(`/update_cliente/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })

        const result = await response.json()

        if (response.ok) {
            showAlert("Cliente aggiornato con successo", "success")

            // Update original values
            inputs.forEach((input) => {
                input.dataset.original = input.value
            })

            row.classList.remove("modified")
            caricaClienti()
        } else {
            showAlert(result.error || "Errore nell'aggiornamento del cliente", "error")
        }
    } catch (error) {
        console.error("Error updating client:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Delete client
function eliminaCliente(id) {
    const row = document.querySelector(`tr[data-cliente-id="${id}"]`)
    const ragioneSociale = row?.querySelector('input[data-field="ragione_sociale"]')?.value?.trim() || "questo cliente"

    showModal(
        "Conferma Eliminazione",
        `Sei sicuro di voler eliminare il cliente ${ragioneSociale}? Verranno eliminati anche tutti i suoi interventi.`,
        () => deleteCliente(id),
    )

}



// Delete client API call
async function deleteCliente(id) {
    try {
        const response = await fetch(`/delete_cliente/${id}`, {
            method: "POST",
        })

        const result = await response.json()

        if (response.ok) {
            showAlert("Cliente eliminato con successo", "success")
            caricaClienti()
        } else {
            showAlert(result.error || "Errore nell'eliminazione del cliente", "error")
        }
    } catch (error) {
        console.error("Error deleting client:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Confirm total deletion
function confermaEliminazioneTotale() {
    showModal(
        "Conferma Eliminazione Totale",
        "Sei sicuro di voler eliminare TUTTI i dati? Questa azione non può essere annullata.",
        deleteAllData,
    )
}

// Delete all data
async function deleteAllData() {
    try {
        const response = await fetch("/delete_all", {
            method: "POST",
        })

        const result = await response.json()

        if (response.ok) {
            showAlert("Tutti i dati sono stati eliminati", "success")
            caricaClienti()
        } else {
            showAlert(result.error || "Errore nell'eliminazione dei dati", "error")
        }
    } catch (error) {
        console.error("Error deleting all data:", error)
        showAlert("Errore di connessione", "error")
    }
}

// Modal functions
function showModal(title, message, confirmAction) {
    if (!modal) return

    modalTitle.textContent = title
    modalMessage.textContent = message
    currentAction = confirmAction
    modal.classList.remove("hidden")
}

function hideModal() {
    if (!modal) return

    modal.classList.add("hidden")
    currentAction = null
}

function handleModalConfirm() {
    if (currentAction) {
        currentAction()
    }
    hideModal()
}

// Alert functions
function showAlert(message, type = "success") {
    if (!alert) return

    alertMessage.textContent = message
    alert.className = `alert alert-${type}`
    alert.classList.remove("hidden")

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideAlert()
    }, 5000)
}

function hideAlert() {
    if (!alert) return
    alert.classList.add("hidden")
}
