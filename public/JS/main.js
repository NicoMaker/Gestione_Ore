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

// --- Ricerca Clienti nella select ---
const searchClientiInput = document.getElementById('search-clienti');
const dipendentiSearchGroup = document.getElementById('dipendenti-search-group');
const searchDipendentiInput = document.getElementById('search-dipendenti');
const listaDipendenti = document.getElementById('lista-dipendenti');
const searchListaClientiInput = document.getElementById('search-lista-clienti');

let clientiList = [];
let dipendentiList = [];

let statusFilter = ["status-success", "status-warning", "status-light-danger", "status-danger"];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    caricaClienti()
    initializeEventListeners()
    initializeStatusFilter();
    const tableHeader = document.querySelector('.table-header');
    if (tableHeader && !document.getElementById('select-status-filter')) {
        const select = document.createElement('select');
        select.id = 'select-status-filter';
        select.style.marginRight = '1rem';
        select.style.padding = '0.4rem 1rem';
        select.style.borderRadius = '8px';
        select.style.border = '1.5px solid #d1d5db';
        select.style.fontSize = '1rem';
        select.style.background = '#f8fafc';
        select.innerHTML = `
            <option value="all">Tutti gli stati</option>
            <option value="status-success">Verde</option>
            <option value="status-warning">Giallo</option>
            <option value="status-light-danger">Arancione</option>
            <option value="status-danger">Rosso</option>
        `;
        tableHeader.insertBefore(select, tableHeader.firstChild);
    }
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
    const clienteId = document.getElementById('cliente_id_hidden')?.value;
    const oreUtilizzate = Number.parseFloat(oreUtilizzateInput.value)

    if (!clienteId) {
        oreUtilizzateInput.setCustomValidity("Seleziona prima un cliente")
        return false
    }

    const cliente = clientiList.find(c => String(c.id) === String(clienteId));
    if (!cliente) {
        oreUtilizzateInput.setCustomValidity("Cliente non trovato")
        return false
    }

    const oreResidue = Number.parseFloat(cliente.ore_residue)

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

        // FILTRO: mostra solo se lo stato è selezionato
        if (!statusFilter.includes(statoClass)) return;

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
    clientiList = clienti;
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
    e.preventDefault();

    const formData = new FormData(formIntervento);
    // Prendi l'ID cliente dal campo hidden
    const clienteId = document.getElementById('cliente_id_hidden')?.value;
    const tipoServizio = formData.get("tipo_servizio");
    const oreUtilizzate = Number.parseFloat(formData.get("ore_utilizzate"));

    // Comprehensive validation
    if (!clienteId) {
        showAlert("Seleziona un cliente", "error");
        return;
    }

    if (!tipoServizio || tipoServizio.trim() === "") {
        showAlert("Tipo servizio è obbligatorio", "error");
        return;
    }

    if (!oreUtilizzate || oreUtilizzate <= 0) {
        showAlert("Ore utilizzate deve essere maggiore di 0", "error");
        return;
    }

    // Validate against available hours
    if (!validateInterventionHours()) {
        showAlert("Controlla le ore utilizzate", "error");
        return;
    }

    // Trova il cliente selezionato
    const cliente = clientiList.find(c => String(c.id) === String(clienteId));
    if (!cliente) {
        showAlert("Cliente non trovato", "error");
        return;
    }
    const oreResidue = Number.parseFloat(cliente.ore_residue);
    if (oreUtilizzate > oreResidue) {
        showAlert(`Ore insufficienti. Disponibili: ${oreResidue.toFixed(1)} ore`, "error");
        return;
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
        });

        const result = await response.json();

        if (response.ok) {
            showAlert("Intervento registrato con successo", "success");
            formIntervento.reset();
            oreUtilizzateInput.setCustomValidity("");
            if (document.getElementById('combo-clienti-input')) document.getElementById('combo-clienti-input').value = '';
            if (document.getElementById('cliente_id_hidden')) document.getElementById('cliente_id_hidden').value = '';
            caricaClienti();
        } else {
            showAlert(result.error || "Errore nella registrazione dell'intervento", "error");
        }
    } catch (error) {
        console.error("Error adding intervention:", error);
        showAlert("Errore di connessione", "error");
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

// Ricerca clienti nella select classica (sempre visibile)
if (searchClientiInput && clienteSelect) {
    searchClientiInput.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        clienteSelect.innerHTML = '<option value="">-- Seleziona Cliente --</option>'
        let filtered = clientiList;
        if (value) {
            filtered = clientiList.filter(c => (c.ragione_sociale || '').toLowerCase().includes(value));
        }
        filtered.forEach((cliente) => {
            const option = document.createElement("option");
            option.value = cliente.id;
            option.textContent = `${cliente.ragione_sociale || "Cliente senza nome"} (${cliente.ore_residue.toFixed(1)} ore)`;
            option.dataset.oreResidue = cliente.ore_residue;
            clienteSelect.appendChild(option);
        });
    });
}

// Ricerca nella lista clienti (sopra tabella)
if (searchListaClientiInput) {
    searchListaClientiInput.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        if (!value) {
            updateClientiTable(clientiList);
            return;
        }
        const filtered = clientiList.filter(c => {
            return (
                (c.ragione_sociale || '').toLowerCase().includes(value) ||
                (c.indirizzo || '').toLowerCase().includes(value) ||
                (c.email || '').toLowerCase().includes(value)
            );
        });
        updateClientiTable(filtered);
    });
}

// --- MULTI-SELECT STATO (COMBO PALLINI) ---
let multiStatusFilter = ["status-success", "status-warning", "status-light-danger", "status-danger"];

function setupMultiStatusCombo() {
    const comboInput = document.getElementById('combo-multistate-input');
    const comboDropdown = document.getElementById('combo-multistate-dropdown');
    const comboLabel = document.getElementById('combo-multistate-label');
    const allCheckbox = document.getElementById('multi-status-all');
    const statusCheckboxes = Array.from(document.querySelectorAll('.multi-status'));

    // Apri/chiudi dropdown
    comboInput.addEventListener('click', function(e) {
        comboDropdown.style.display = comboDropdown.style.display === 'block' ? 'none' : 'block';
    });
    comboInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            comboDropdown.style.display = comboDropdown.style.display === 'block' ? 'none' : 'block';
        }
    });
    document.addEventListener('click', function(e) {
        if (!comboInput.contains(e.target) && !comboDropdown.contains(e.target)) {
            comboDropdown.style.display = 'none';
        }
    });

    // Gestione "Tutti"
    allCheckbox.addEventListener('change', function() {
        if (allCheckbox.checked) {
            statusCheckboxes.forEach(cb => cb.checked = true);
        } else {
            statusCheckboxes.forEach(cb => cb.checked = false);
        }
        updateMultiStatusFilter();
    });
    // Gestione singoli
    statusCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const allChecked = statusCheckboxes.every(cb => cb.checked);
            allCheckbox.checked = allChecked;
            updateMultiStatusFilter();
        });
    });
    // Aggiorna filtro e label
    function updateMultiStatusFilter() {
        const selected = statusCheckboxes.filter(cb => cb.checked).map(cb => cb.dataset.status);
        multiStatusFilter = selected.length === 0 ? ["status-success", "status-warning", "status-light-danger", "status-danger"] : selected;
        // Aggiorna etichetta
        if (selected.length === 0 || selected.length === 4) {
            comboLabel.textContent = 'Tutti gli stati';
        } else {
            const map = {
                'status-success': 'Verde',
                'status-warning': 'Giallo',
                'status-light-danger': 'Arancione',
                'status-danger': 'Rosso'
            };
            comboLabel.textContent = selected.map(s => map[s]).join(', ');
        }
        filterClienti();
        saveSearchState(); // <--- Salva stato ogni volta che cambia filtro
    }
}

// --- PERSISTENZA STATO RICERCA E FILTRI ---
const STORAGE_KEY = 'clienti_search_state';

function saveSearchState() {
    const state = {
        searchText,
        multiStatusFilter
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSearchState() {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (typeof state.searchText === 'string') {
        searchText = state.searchText;
        // Aggiorna input se esiste
        if (document.getElementById('search-utenti')) {
            document.getElementById('search-utenti').value = searchText;
        }
    }
    if (Array.isArray(state.multiStatusFilter)) {
        multiStatusFilter = state.multiStatusFilter;
        // Aggiorna checkboxes multi-stato se esistono
        const statusCheckboxes = document.querySelectorAll('.multi-status');
        statusCheckboxes.forEach(cb => {
            cb.checked = multiStatusFilter.includes(cb.dataset.status);
        });
        // Aggiorna "Tutti" se serve
        const allCheckbox = document.getElementById('multi-status-all');
        if (allCheckbox) {
            allCheckbox.checked = statusCheckboxes.length > 0 && Array.from(statusCheckboxes).every(cb => cb.checked);
        }
        // Aggiorna etichetta
        const comboLabel = document.getElementById('combo-multistate-label');
        if (comboLabel) {
            if (multiStatusFilter.length === 0 || multiStatusFilter.length === 4) {
                comboLabel.textContent = 'Tutti gli stati';
            } else {
                const map = {
                    'status-success': 'Verde',
                    'status-warning': 'Giallo',
                    'status-light-danger': 'Arancione',
                    'status-danger': 'Rosso'
                };
                comboLabel.textContent = multiStatusFilter.map(s => map[s]).join(', ');
            }
        }
    }
}

// LOGICA DI FILTRAGGIO COMBINATO
let searchText = "";
function filterClienti() {
    let filtered = clientiList;
    // Filtro testo
    if (searchText) {
        filtered = filtered.filter(c =>
            (c.ragione_sociale || '').toLowerCase().includes(searchText) ||
            (c.indirizzo || '').toLowerCase().includes(searchText) ||
            (c.email || '').toLowerCase().includes(searchText)
        );
    }
    // Filtro stato da combo multi
    filtered = filtered.filter(c => {
        const oreUtilizzate = (c.ore_acquistate - c.ore_residue);
        const percentualeUsata = (oreUtilizzate / c.ore_acquistate) * 100;
        let statoClass = "";
        switch (true) {
            case (c.ore_residue <= 0):
                statoClass = "status-danger"; break;
            case (percentualeUsata <= 70):
                statoClass = "status-success"; break;
            case (percentualeUsata <= 85):
                statoClass = "status-warning"; break;
            case (percentualeUsata <= 99.9):
                statoClass = "status-light-danger"; break;
        }
        return multiStatusFilter.includes(statoClass);
    });
    updateClientiTable(filtered);
    // Evidenzia tabella se ricerca attiva e tutti gli stati selezionati
    const tableCard = document.querySelector('.table-card');
    if (tableCard) {
        if (searchText && multiStatusFilter.length === 4) {
            tableCard.classList.add('highlight-search');
        } else {
            tableCard.classList.remove('highlight-search');
        }
    }
    saveSearchState(); // <--- Salva stato ogni volta che filtri
}
// EVENTI DI RICERCA
const searchUtentiInput = document.getElementById('search-utenti');
if (searchUtentiInput) {
    searchUtentiInput.addEventListener('input', function () {
        searchText = this.value.toLowerCase();
        filterClienti();
    });
}
// Inizializza combo multi-stato al DOMContentLoaded

document.addEventListener("DOMContentLoaded", () => {
    loadSearchState(); // <--- Carica stato all'avvio
    setupMultiStatusCombo();
    filterClienti(); // <--- Applica subito filtri e ricerca
});

const comboClientiInput = document.getElementById('combo-clienti');
const dropdownClienti = document.getElementById('dropdown-clienti');
const comboDipendentiInput = document.getElementById('combo-dipendenti');
const dropdownDipendenti = document.getElementById('dropdown-dipendenti');
let selectedClienteId = null;
let selectedDipendente = null;

// Combo filtrabile clienti
if (comboClientiInput && dropdownClienti) {
    comboClientiInput.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        dropdownClienti.innerHTML = '';
        selectedClienteId = null;
        if (!value) {
            dropdownClienti.style.display = 'none';
            return;
        }
        const filtered = clientiList.filter(c => (c.ragione_sociale || '').toLowerCase().includes(value));
        if (filtered.length === 0) {
            dropdownClienti.innerHTML = '<li class="dropdown-empty">Nessun cliente trovato</li>';
        } else {
            filtered.forEach(c => {
                const li = document.createElement('li');
                li.textContent = `${c.ragione_sociale} (${c.ore_residue.toFixed(1)} ore)`;
                li.className = 'dropdown-item';
                li.addEventListener('mousedown', function (e) {
                    comboClientiInput.value = c.ragione_sociale;
                    selectedClienteId = c.id;
                    dropdownClienti.style.display = 'none';
                    // Mostra ricerca dipendenti
                    dipendentiSearchGroup.style.display = '';
                });
                dropdownClienti.appendChild(li);
            });
        }
        dropdownClienti.style.display = 'block';
    });
    comboClientiInput.addEventListener('blur', function () {
        setTimeout(() => { dropdownClienti.style.display = 'none'; }, 120);
    });
}

// Combo filtrabile dipendenti (mock)
if (comboDipendentiInput && dropdownDipendenti) {
    comboDipendentiInput.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        dropdownDipendenti.innerHTML = '';
        selectedDipendente = null;
        if (!value) {
            dropdownDipendenti.style.display = 'none';
            return;
        }
        // Mock dipendenti
        dipendentiList = [
            { nome: 'Mario Rossi' },
            { nome: 'Luca Bianchi' },
            { nome: 'Giulia Verdi' },
            { nome: 'Anna Neri' }
        ];
        const filtered = dipendentiList.filter(d => d.nome.toLowerCase().includes(value));
        if (filtered.length === 0) {
            dropdownDipendenti.innerHTML = '<li class="dropdown-empty">Nessun dipendente trovato</li>';
        } else {
            filtered.forEach(d => {
                const li = document.createElement('li');
                li.textContent = d.nome;
                li.className = 'dropdown-item';
                li.addEventListener('mousedown', function (e) {
                    comboDipendentiInput.value = d.nome;
                    selectedDipendente = d.nome;
                    dropdownDipendenti.style.display = 'none';
                });
                dropdownDipendenti.appendChild(li);
            });
        }
        dropdownDipendenti.style.display = 'block';
    });
    comboDipendentiInput.addEventListener('blur', function () {
        setTimeout(() => { dropdownDipendenti.style.display = 'none'; }, 120);
    });
}

// Combo custom clienti
const comboBox = document.getElementById('combo-clienti-box');
const comboInput = document.getElementById('combo-clienti-input');
const comboDropdown = document.getElementById('combo-clienti-dropdown');
const comboSearch = document.getElementById('combo-clienti-search');
const comboList = document.getElementById('combo-clienti-list');
const clienteIdHidden = document.getElementById('cliente_id_hidden');
const statoClienteSelect = document.getElementById('stato_cliente');
let comboSelectedId = null;

if (comboBox && comboInput && comboDropdown && comboSearch && comboList) {
    // Apri/chiudi dropdown
    comboInput.addEventListener('click', function (e) {
        comboDropdown.style.display = 'block';
        comboSearch.value = '';
        renderComboList(getFilteredClientiList());
        comboSearch.focus();
    });
    // Chiudi dropdown se clicchi fuori
    document.addEventListener('click', function (e) {
        if (!comboBox.contains(e.target)) {
            comboDropdown.style.display = 'none';
        }
    });
    // Ricerca live
    comboSearch.addEventListener('input', function () {
        const value = this.value.toLowerCase();
        let filtered = getFilteredClientiList();
        if (value) {
            filtered = filtered.filter(c => (c.ragione_sociale || '').toLowerCase().includes(value));
        }
        renderComboList(filtered);
    });
    // Filtro stato: aggiorna lista clienti quando cambia la select stato
    if (statoClienteSelect) {
        statoClienteSelect.addEventListener('change', function () {
            renderComboList(getFilteredClientiList());
        });
    }
    function getFilteredClientiList() {
        if (!statoClienteSelect) return clientiList;
        const selected = Array.from(statoClienteSelect.selectedOptions).map(opt => opt.value);
        if (selected.length === 0) return clientiList;
        return clientiList.filter(c => {
            const oreUtilizzate = (c.ore_acquistate - c.ore_residue);
            const percentualeUsata = (oreUtilizzate / c.ore_acquistate) * 100;
            let statoClass = '';
            switch (true) {
                case (c.ore_residue <= 0):
                    statoClass = 'status-danger'; break;
                case (percentualeUsata <= 70):
                    statoClass = 'status-success'; break;
                case (percentualeUsata <= 85):
                    statoClass = 'status-warning'; break;
                case (percentualeUsata <= 99.9):
                    statoClass = 'status-light-danger'; break;
            }
            return selected.includes(statoClass);
        });
    }
    function renderComboList(list) {
        comboList.innerHTML = '';
        if (list.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Nessun cliente trovato';
            li.className = 'combo-dropdown-empty';
            comboList.appendChild(li);
            return;
        }
        list.forEach(c => {
            const li = document.createElement('li');
            // Calcola stato
            const oreUtilizzate = (c.ore_acquistate - c.ore_residue);
            const percentualeUsata = (oreUtilizzate / c.ore_acquistate) * 100;
            let statoClass = '';
            switch (true) {
                case (c.ore_residue <= 0):
                    statoClass = 'status-danger'; break;
                case (percentualeUsata <= 70):
                    statoClass = 'status-success'; break;
                case (percentualeUsata <= 85):
                    statoClass = 'status-warning'; break;
                case (percentualeUsata <= 99.9):
                    statoClass = 'status-light-danger'; break;
            }
            li.innerHTML = `<span class="status-indicator ${statoClass}" style="margin-right:0.5rem;"></span>${c.ragione_sociale || 'Cliente senza nome'} (${c.ore_residue.toFixed(1)} ore)`;
            li.className = 'combo-dropdown-item';
            li.tabIndex = 0;
            li.addEventListener('mousedown', function (e) {
                comboInput.value = c.ragione_sociale;
                comboSelectedId = c.id;
                if (clienteIdHidden) clienteIdHidden.value = c.id;
                comboDropdown.style.display = 'none';
            });
            comboList.appendChild(li);
        });
    }
}

// Sostituisco la gestione dei checkbox con la select multipla per il filtro stato
function initializeStatusFilter() {
    const statusSelect = document.getElementById("status-multiselect");
    if (!statusSelect) return;

    function getSelectedStatuses() {
        // Ottieni tutti i valori selezionati
        return Array.from(statusSelect.selectedOptions).map(opt => opt.value);
    }

    function applyStatusFilter() {
        const selected = getSelectedStatuses();
        // Se nessuno selezionato, mostra tutti
        statusFilter = selected.length === 0 ? ["status-success", "status-warning", "status-light-danger", "status-danger"] : selected;
        filterClienti(); // Aggiorna la tabella con il filtro combinato
    }

    // Evento su cambio selezione
    statusSelect.addEventListener("change", applyStatusFilter);

    // Applica subito il filtro all'avvio
    applyStatusFilter();
}