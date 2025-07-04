// DOM elements
const formInterventoProgrammato = document.getElementById("form-intervento-programmato")
const clienteProgrammato = document.getElementById("cliente_programmato")
const tabellaInterventiProgrammati = document.getElementById("tabella-interventi-programmati")
const totalActiveContracts = document.getElementById("total-active-contracts")
const totalPendingInterventions = document.getElementById("total-pending-interventions")
const totalAvailableHours = document.getElementById("total-available-hours")
const filterStatus = document.getElementById("filter-status")

// Navigation
const hamburger = document.querySelector(".hamburger")
const navMenu = document.querySelector(".nav-menu")

// Alert
const alert = document.getElementById("alert")
const alertMessage = document.getElementById("alert-message")
const alertClose = document.getElementById("alert-close")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    loadData()
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

    // Form
    if (formInterventoProgrammato) {
        formInterventoProgrammato.addEventListener("submit", handleInterventoSubmit)
    }

    // Filter
    if (filterStatus) {
        filterStatus.addEventListener("change", loadData)
    }

    // Alert
    if (alertClose) {
        alertClose.addEventListener("click", hideAlert)
    }
}

// Load data
async function loadData() {
    try {
        const [clientsResponse] = await Promise.all([fetch("/api/clienti")])

        if (clientsResponse.ok) {
            const clients = await clientsResponse.json()
            updateStats(clients)
            updateClientSelect(clients)
            loadScheduledInterventions()
        }
    } catch (error) {
        console.error("Error loading data:", error)
        showAlert("Errore nel caricamento dei dati", "error")
    }
}

// Update stats
function updateStats(clients) {
    const activeContracts = clients.filter((c) => c.ore_residue > 0).length
    const totalHours = clients.reduce((acc, c) => acc + c.ore_residue, 0)

    if (totalActiveContracts) totalActiveContracts.textContent = activeContracts
    if (totalAvailableHours) totalAvailableHours.textContent = totalHours.toFixed(1)
}

// Update client select
function updateClientSelect(clients) {
    if (!clienteProgrammato) return

    clienteProgrammato.innerHTML = '<option value="">-- Seleziona Cliente --</option>'

    clients
        .filter((c) => c.ore_residue > 0)
        .forEach((client) => {
            const option = document.createElement("option")
            option.value = client.id
            option.textContent = `${client.ragione_sociale} (${client.ore_residue.toFixed(1)} ore)`
            clienteProgrammato.appendChild(option)
        })
}

// Load scheduled interventions (placeholder)
function loadScheduledInterventions() {
    if (!tabellaInterventiProgrammati) return

    const tbody = tabellaInterventiProgrammati.querySelector("tbody")
    tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; color: var(--gray-500); padding: 2rem;">
        Funzionalità in sviluppo - Gli interventi programmati verranno visualizzati qui
      </td>
    </tr>
  `
}

// Handle intervention submit
async function handleInterventoSubmit(e) {
    e.preventDefault()
    showAlert("Funzionalità in sviluppo", "warning")
}

// Alert functions
function showAlert(message, type = "success") {
    if (!alert) return

    if (alertMessage) alertMessage.textContent = message
    alert.className = `alert alert-${type}`
    alert.classList.remove("hidden")

    setTimeout(() => {
        hideAlert()
    }, 5000)
}

function hideAlert() {
    if (alert) {
        alert.classList.add("hidden")
    }
}
