// DOM elements
const tabellaContratti = document.getElementById("tabella-contratti")
const hamburger = document.querySelector(".hamburger")
const navMenu = document.querySelector(".nav-menu")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    caricaContratti()
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
}

// Load contracts
async function caricaContratti() {
    try {
        const response = await fetch("/api/clienti")
        const clienti = await response.json()

        if (response.ok) {
            updateContrattiTable(clienti)
        } else {
            console.error("Error loading contracts")
        }
    } catch (error) {
        console.error("Error loading contracts:", error)
    }
}

// Update contracts table
function updateContrattiTable(clienti) {
    const tbody = tabellaContratti.querySelector("tbody")
    tbody.innerHTML = ""

    if (clienti.length === 0) {
        const row = document.createElement("tr")
        row.innerHTML = `
      <td colspan="4" style="text-align: center; color: var(--gray-500); padding: 2rem;">
        Nessun contratto disponibile
      </td>
    `
        tbody.appendChild(row)
        return
    }

    clienti.forEach((cliente) => {
        let statusClass = "status-success"
        let statusColor = "#10b981"

        if (cliente.ore_residue <= 0) {
            statusClass = "status-danger"
            statusColor = "#ef4444"
        } else if (cliente.ore_residue <= 2) {
            statusClass = "status-warning"
            statusColor = "#f59e0b"
        }

        const row = document.createElement("tr")
        row.innerHTML = `
      <td>${cliente.ragione_sociale || "Cliente senza nome"}</td>
      <td>${cliente.ore_residue.toFixed(1)} ore</td>
      <td>
        <span class="status-indicator ${statusClass}"></span>
      </td>
      <td>
        <a href="/report_cliente/${cliente.id}" target="_blank" class="btn btn-primary btn-sm">
          Stampa
        </a>
      </td>
    `
        tbody.appendChild(row)
    })
}

// Refresh data every 3 seconds
setInterval(caricaContratti, 3000)
