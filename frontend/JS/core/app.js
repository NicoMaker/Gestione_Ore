// ==================== STATO GLOBALE, DOM & BOOTSTRAP ====================
// Global variables
let currentAction = null;
const editingClientId = null;
const originalClientData = {};

// DOM elements
const formCliente = document.getElementById("form-cliente");
const formIntervento = document.getElementById("form-intervento");
const tabellaClienti = document.getElementById("tabella-clienti");
const clienteSelect = document.getElementById("cliente_id");
const oreUtilizzateInput = document.getElementById("ore_utilizzate");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalConfirm = document.getElementById("modal-confirm");
const modalCancel = document.getElementById("modal-cancel");
const alert = document.getElementById("alert");
const alertMessage = document.getElementById("alert-message");
const alertClose = document.getElementById("alert-close");

// Navigation
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

// --- Ricerca Clienti nella select ---
const searchClientiInput = document.getElementById("search-clienti");
const dipendentiSearchGroup = document.getElementById(
  "dipendenti-search-group",
);
const searchDipendentiInput = document.getElementById("search-dipendenti");
const listaDipendenti = document.getElementById("lista-dipendenti");
const searchListaClientiInput = document.getElementById("search-lista-clienti");

let clientiList = [];
let dipendentiList = [];

let statusFilter = [
  "status-success",
  "status-warning",
  "status-light-danger",
  "status-danger",
];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  caricaClienti();
  initializeEventListeners();
  initializeStatusFilter();
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

  // Forms
  if (formCliente) {
    formCliente.addEventListener("submit", handleClienteSubmit);
  }

  if (formIntervento) {
    formIntervento.addEventListener("submit", handleInterventoSubmit);
  }

  // Real-time validation for intervention hours
  if (oreUtilizzateInput) {
    oreUtilizzateInput.addEventListener("input", validateInterventionHours);
  }

  if (clienteSelect) {
    clienteSelect.addEventListener("change", updateMaxHours);
  }

  // Modal
  if (modalConfirm) modalConfirm.addEventListener("click", handleModalConfirm);
  if (modalCancel) modalCancel.addEventListener("click", hideModal);

  // Alert
  if (alertClose) alertClose.addEventListener("click", hideAlert);

  // Close modal on outside click
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideModal();
      }
    });
  }
}

// Update max hours for intervention form

// Validate intervention hours in real-time

// Load clients

// Update clients table

// Mark row as modified

// Cancel modifications

// Update client select

// Handle client form submit

// Handle intervention form submit

// Save client

// Delete client

// Delete client API call

// Confirm total deletion

// Delete all data

// Modal functions

// Alert functions

// Ricerca clienti nella select classica (sempre visibile)
if (searchClientiInput && clienteSelect) {
  searchClientiInput.addEventListener("input", function () {
    const value = this.value.toLowerCase();
    clienteSelect.innerHTML =
      '<option value="">-- Seleziona Cliente --</option>';
    let filtered = clientiList;
    if (value) {
      filtered = clientiList.filter((c) =>
        (c.ragione_sociale || "").toLowerCase().includes(value),
      );
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
  searchListaClientiInput.addEventListener("input", function () {
    searchText = this.value.toLowerCase();
    filterClienti();
    saveSearchState();
  });
}

// --- MULTI-SELECT STATO (COMBO PALLINI) ---
let multiStatusFilter = [
  "status-success",
  "status-warning",
  "status-light-danger",
  "status-danger",
];

// --- PERSISTENZA STATO RICERCA E FILTRI ---
const STORAGE_KEY = "clienti_search_state";

// LOGICA DI FILTRAGGIO COMBINATO
let searchText = "";
// EVENTI DI RICERCA
const searchUtentiInput = document.getElementById("search-utenti");
if (searchUtentiInput) {
  searchUtentiInput.addEventListener("input", function () {
    searchText = this.value.toLowerCase();
    filterClienti();
    saveSearchState();
  });
}
// Inizializza combo multi-stato al DOMContentLoaded

document.addEventListener("DOMContentLoaded", () => {
  loadSearchState(); // <--- Carica stato all'avvio
  setupMultiStatusCombo();
  filterClienti(); // <--- Applica subito filtri e ricerca
  // Se torniamo dal report, i filtri e la ricerca sono già applicati
});

const comboClientiInput = document.getElementById("combo-clienti");
const dropdownClienti = document.getElementById("dropdown-clienti");
const comboDipendentiInput = document.getElementById("combo-dipendenti");
const dropdownDipendenti = document.getElementById("dropdown-dipendenti");
let selectedClienteId = null;
let selectedDipendente = null;

// Combo filtrabile clienti
if (comboClientiInput && dropdownClienti) {
  comboClientiInput.addEventListener("input", function () {
    const value = this.value.toLowerCase();
    dropdownClienti.innerHTML = "";
    selectedClienteId = null;
    if (!value) {
      dropdownClienti.style.display = "none";
      return;
    }
    const filtered = clientiList.filter((c) =>
      (c.ragione_sociale || "").toLowerCase().includes(value),
    );
    if (filtered.length === 0) {
      dropdownClienti.innerHTML =
        '<li class="dropdown-empty">Nessun cliente trovato</li>';
    } else {
      filtered.forEach((c) => {
        const li = document.createElement("li");
        li.textContent = `${c.ragione_sociale} (${c.ore_residue.toFixed(1)} ore)`;
        li.className = "dropdown-item";
        li.addEventListener("mousedown", function (e) {
          comboClientiInput.value = c.ragione_sociale;
          selectedClienteId = c.id;
          dropdownClienti.style.display = "none";
          // Mostra ricerca dipendenti
          dipendentiSearchGroup.style.display = "";
        });
        dropdownClienti.appendChild(li);
      });
    }
    dropdownClienti.style.display = "block";
  });
  comboClientiInput.addEventListener("blur", function () {
    setTimeout(() => {
      dropdownClienti.style.display = "none";
    }, 120);
  });
}

// Combo filtrabile dipendenti (mock)
if (comboDipendentiInput && dropdownDipendenti) {
  comboDipendentiInput.addEventListener("input", function () {
    const value = this.value.toLowerCase();
    dropdownDipendenti.innerHTML = "";
    selectedDipendente = null;
    if (!value) {
      dropdownDipendenti.style.display = "none";
      return;
    }
    // Mock dipendenti
    dipendentiList = [
      { nome: "Mario Rossi" },
      { nome: "Luca Bianchi" },
      { nome: "Giulia Verdi" },
      { nome: "Anna Neri" },
    ];
    const filtered = dipendentiList.filter((d) =>
      d.nome.toLowerCase().includes(value),
    );
    if (filtered.length === 0) {
      dropdownDipendenti.innerHTML =
        '<li class="dropdown-empty">Nessun dipendente trovato</li>';
    } else {
      filtered.forEach((d) => {
        const li = document.createElement("li");
        li.textContent = d.nome;
        li.className = "dropdown-item";
        li.addEventListener("mousedown", function (e) {
          comboDipendentiInput.value = d.nome;
          selectedDipendente = d.nome;
          dropdownDipendenti.style.display = "none";
        });
        dropdownDipendenti.appendChild(li);
      });
    }
    dropdownDipendenti.style.display = "block";
  });
  comboDipendentiInput.addEventListener("blur", function () {
    setTimeout(() => {
      dropdownDipendenti.style.display = "none";
    }, 120);
  });
}

// Combo custom clienti
const comboBox = document.getElementById("combo-clienti-box");
const comboInput = document.getElementById("combo-clienti-input");
const comboDropdown = document.getElementById("combo-clienti-dropdown");
const comboSearch = document.getElementById("combo-clienti-search");
const comboList = document.getElementById("combo-clienti-list");
const clienteIdHidden = document.getElementById("cliente_id_hidden");
const statoClienteSelect = document.getElementById("stato_cliente");
let comboSelectedId = null;

if (comboBox && comboInput && comboDropdown && comboSearch && comboList) {
  // Apri/chiudi dropdown
  comboInput.addEventListener("click", function (e) {
    comboDropdown.style.display = "block";
    comboSearch.value = "";
    renderComboList(getFilteredClientiList());
    comboSearch.focus();
  });
  // Chiudi dropdown se clicchi fuori
  document.addEventListener("click", function (e) {
    if (!comboBox.contains(e.target)) {
      comboDropdown.style.display = "none";
    }
  });
  // Ricerca live
  comboSearch.addEventListener("input", function () {
    const value = this.value.toLowerCase();
    let filtered = getFilteredClientiList();
    if (value) {
      filtered = filtered.filter((c) =>
        (c.ragione_sociale || "").toLowerCase().includes(value),
      );
    }
    renderComboList(filtered);
  });
  // Filtro stato: aggiorna lista clienti quando cambia la select stato
  if (statoClienteSelect) {
    statoClienteSelect.addEventListener("change", function () {
      renderComboList(getFilteredClientiList());
    });
  }
  function getFilteredClientiList() {
    if (!statoClienteSelect) return clientiList;
    const selected = Array.from(statoClienteSelect.selectedOptions).map(
      (opt) => opt.value,
    );
    if (selected.length === 0) return clientiList;
    return clientiList.filter((c) => {
      const oreUtilizzate = c.ore_acquistate - c.ore_residue;
      const percentualeUsata = (oreUtilizzate / c.ore_acquistate) * 100;
      let statoClass = "";
      switch (true) {
        case c.ore_residue <= 0:
          statoClass = "status-danger";
          break;
        case percentualeUsata <= 70:
          statoClass = "status-success";
          break;
        case percentualeUsata <= 85:
          statoClass = "status-warning";
          break;
        case percentualeUsata <= 99.9:
          statoClass = "status-light-danger";
          break;
      }
      return selected.includes(statoClass);
    });
  }
  function renderComboList(list) {
    comboList.innerHTML = "";
    if (list.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Nessun cliente trovato";
      li.className = "combo-dropdown-empty";
      comboList.appendChild(li);
      return;
    }
    list.forEach((c) => {
      const li = document.createElement("li");
      // Calcola stato
      const oreUtilizzate = c.ore_acquistate - c.ore_residue;
      const percentualeUsata = (oreUtilizzate / c.ore_acquistate) * 100;
      let statoClass = "";
      switch (true) {
        case c.ore_residue <= 0:
          statoClass = "status-danger";
          break;
        case percentualeUsata <= 70:
          statoClass = "status-success";
          break;
        case percentualeUsata <= 85:
          statoClass = "status-warning";
          break;
        case percentualeUsata <= 99.9:
          statoClass = "status-light-danger";
          break;
      }
      li.innerHTML = `<span class="status-indicator ${statoClass}" style="margin-right:0.5rem;"></span>${c.ragione_sociale || "Cliente senza nome"} (${c.ore_residue.toFixed(1)} ore)`;
      li.className = "combo-dropdown-item";
      li.tabIndex = 0;
      li.addEventListener("mousedown", function (e) {
        comboInput.value = c.ragione_sociale;
        comboSelectedId = c.id;
        if (clienteIdHidden) clienteIdHidden.value = c.id;
        comboDropdown.style.display = "none";
      });
      comboList.appendChild(li);
    });
  }
}

// Sostituisco la gestione dei checkbox con la select multipla per il filtro stato
