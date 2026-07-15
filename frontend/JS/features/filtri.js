// ==================== RICERCA, FILTRI & PERSISTENZA ====================
function setupMultiStatusCombo() {
  const comboInput = document.getElementById("combo-multistate-input");
  const comboDropdown = document.getElementById("combo-multistate-dropdown");
  const comboLabel = document.getElementById("combo-multistate-label");
  const allCheckbox = document.getElementById("multi-status-all");
  const statusCheckboxes = Array.from(
    document.querySelectorAll(".multi-status"),
  );

  // Apri/chiudi dropdown
  comboInput.addEventListener("click", function (e) {
    comboDropdown.style.display =
      comboDropdown.style.display === "block" ? "none" : "block";
  });
  comboInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      comboDropdown.style.display =
        comboDropdown.style.display === "block" ? "none" : "block";
    }
  });
  document.addEventListener("click", function (e) {
    if (!comboInput.contains(e.target) && !comboDropdown.contains(e.target)) {
      comboDropdown.style.display = "none";
    }
  });

  // Gestione "Tutti"
  allCheckbox.addEventListener("change", function () {
    if (allCheckbox.checked) {
      statusCheckboxes.forEach((cb) => (cb.checked = true));
    } else {
      statusCheckboxes.forEach((cb) => (cb.checked = false));
    }
    updateMultiStatusFilter();
  });
  // Gestione singoli
  statusCheckboxes.forEach((cb) => {
    cb.addEventListener("change", function () {
      const allChecked = statusCheckboxes.every((cb) => cb.checked);
      allCheckbox.checked = allChecked;
      updateMultiStatusFilter();
    });
  });
  // Aggiorna filtro e label
  function updateMultiStatusFilter() {
    const selected = statusCheckboxes
      .filter((cb) => cb.checked)
      .map((cb) => cb.dataset.status);
    multiStatusFilter =
      selected.length === 0
        ? [
            "status-success",
            "status-warning",
            "status-light-danger",
            "status-danger",
          ]
        : selected;
    // Aggiorna etichetta
    if (selected.length === 0 || selected.length === 4) {
      comboLabel.textContent = "Tutti gli stati";
    } else {
      const map = {
        "status-success": "Verde",
        "status-warning": "Giallo",
        "status-light-danger": "Arancione",
        "status-danger": "Rosso",
      };
      comboLabel.textContent = selected.map((s) => map[s]).join(", ");
    }
    filterClienti();
    saveSearchState(); // <--- Salva stato ogni volta che cambia filtro
  }
}
function saveSearchState() {
  const state = {
    searchText,
    multiStatusFilter,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadSearchState() {
  const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  if (typeof state.searchText === "string") {
    searchText = state.searchText;
    // Aggiorna input se esiste
    if (document.getElementById("search-utenti")) {
      document.getElementById("search-utenti").value = searchText;
    }
    if (document.getElementById("search-lista-clienti")) {
      document.getElementById("search-lista-clienti").value = searchText;
    }
  }
  if (Array.isArray(state.multiStatusFilter)) {
    multiStatusFilter = state.multiStatusFilter;
    // Aggiorna checkboxes multi-stato se esistono
    const statusCheckboxes = document.querySelectorAll(".multi-status");
    statusCheckboxes.forEach((cb) => {
      cb.checked = multiStatusFilter.includes(cb.dataset.status);
    });
    // Aggiorna "Tutti" se serve
    const allCheckbox = document.getElementById("multi-status-all");
    if (allCheckbox) {
      allCheckbox.checked =
        statusCheckboxes.length > 0 &&
        Array.from(statusCheckboxes).every((cb) => cb.checked);
    }
    // Aggiorna etichetta
    const comboLabel = document.getElementById("combo-multistate-label");
    if (comboLabel) {
      if (multiStatusFilter.length === 0 || multiStatusFilter.length === 4) {
        comboLabel.textContent = "Tutti gli stati";
      } else {
        const map = {
          "status-success": "Verde",
          "status-warning": "Giallo",
          "status-light-danger": "Arancione",
          "status-danger": "Rosso",
        };
        comboLabel.textContent = multiStatusFilter
          .map((s) => map[s])
          .join(", ");
      }
    }
  }
}
function filterClienti() {
  let filtered = clientiList;
  // Filtro testo
  if (searchText) {
    filtered = filtered.filter(
      (c) =>
        (c.ragione_sociale || "").toLowerCase().includes(searchText) ||
        (c.indirizzo || "").toLowerCase().includes(searchText) ||
        (c.email || "").toLowerCase().includes(searchText),
    );
  }
  // Filtro stato da combo multi
  filtered = filtered.filter((c) => {
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
    return multiStatusFilter.includes(statoClass);
  });
  updateClientiTable(filtered);
  // Evidenzia tabella se ricerca attiva e tutti gli stati selezionati
  const tableCard = document.querySelector(".table-card");
  if (tableCard) {
    if (searchText && multiStatusFilter.length === 4) {
      tableCard.classList.add("highlight-search");
    } else {
      tableCard.classList.remove("highlight-search");
    }
  }
  saveSearchState(); // <--- Salva stato ogni volta che filtri
}
function initializeStatusFilter() {
  const statusSelect = document.getElementById("status-multiselect");
  if (!statusSelect) return;

  function getSelectedStatuses() {
    // Ottieni tutti i valori selezionati
    return Array.from(statusSelect.selectedOptions).map((opt) => opt.value);
  }

  function applyStatusFilter() {
    const selected = getSelectedStatuses();
    // Se nessuno selezionato, mostra tutti
    statusFilter =
      selected.length === 0
        ? [
            "status-success",
            "status-warning",
            "status-light-danger",
            "status-danger",
          ]
        : selected;
    filterClienti(); // Aggiorna la tabella con il filtro combinato
  }

  // Evento su cambio selezione
  statusSelect.addEventListener("change", applyStatusFilter);

  // Applica subito il filtro all'avvio
  applyStatusFilter();
}
