// ==================== ELIMINAZIONE MULTIPLA (checkbox + seleziona tutti) ====================
// Condiviso da index.html (clienti) e report.html (interventi).
// Funzioni globali come il resto del frontend (script classici, niente moduli).
//
// Uso nelle tabelle:
//   - <th> con checkbox "seleziona tutti":  id="bulk-all-<entity>"  onchange="bulkToggleAll('<entity>', this)"
//   - cella di riga:                         bulkCheckboxCell('<entity>', id)
//   - barra azioni (hidden di default):      #bulk-toolbar-<entity>, #bulk-count-<entity>
//   - a fine render della tabella:           bulkUpdateToolbar('<entity>')
//
// "Seleziona tutti" agisce solo sulle righe visibili (quelle già filtrate dalla
// ricerca); la selezione si azzera ad ogni ridisegno della tabella, così non si
// elimina mai qualcosa che i filtri nascondono.

const BULK_CONFIG = {
  clienti: {
    endpoint: "/api/clienti/elimina-multiple",
    singolare: "cliente",
    plurale: "clienti",
    avviso: "Verranno eliminati anche tutti i loro interventi.",
    ricarica: () => caricaClienti(),
  },
  interventi: {
    endpoint: "/api/interventi/elimina-multiple",
    singolare: "intervento",
    plurale: "interventi",
    avviso: "Le ore utilizzate torneranno disponibili al cliente.",
    ricarica: () => loadClientReport(),
  },
};

function bulkChecked(entity) {
  return Array.from(
    document.querySelectorAll(`.bulk-cb[data-entity="${entity}"]:checked`),
  ).map((cb) => Number.parseInt(cb.dataset.id, 10));
}

// Cella checkbox da inserire come prima colonna di ogni riga
function bulkCheckboxCell(entity, id, extraClass = "") {
  return `<td class="bulk-col ${extraClass}"><input type="checkbox" class="bulk-cb" data-entity="${entity}" data-id="${id}" onchange="bulkUpdateToolbar('${entity}')" title="Seleziona" aria-label="Seleziona"></td>`;
}

function bulkUpdateToolbar(entity) {
  const toolbar = document.getElementById(`bulk-toolbar-${entity}`);
  const countEl = document.getElementById(`bulk-count-${entity}`);
  const selAll = document.getElementById(`bulk-all-${entity}`);
  const all = document.querySelectorAll(`.bulk-cb[data-entity="${entity}"]`);
  const n = bulkChecked(entity).length;

  all.forEach((cb) => cb.closest("tr")?.classList.toggle("bulk-selected", cb.checked));
  if (toolbar) toolbar.hidden = n === 0;
  if (countEl) countEl.textContent = n + (n === 1 ? " selezionato" : " selezionati");
  if (selAll) {
    selAll.disabled = all.length === 0;
    selAll.checked = n > 0 && n === all.length;
    selAll.indeterminate = n > 0 && n < all.length;
  }
}

function bulkToggleAll(entity, source) {
  document
    .querySelectorAll(`.bulk-cb[data-entity="${entity}"]`)
    .forEach((cb) => (cb.checked = source.checked));
  bulkUpdateToolbar(entity);
}

function bulkClear(entity) {
  document
    .querySelectorAll(`.bulk-cb[data-entity="${entity}"]`)
    .forEach((cb) => (cb.checked = false));
  bulkUpdateToolbar(entity);
}

function bulkDelete(entity) {
  const cfg = BULK_CONFIG[entity];
  const ids = bulkChecked(entity);
  if (!cfg || ids.length === 0) return;

  // index.html usa showModal, report.html showConfirmModal (stessa firma)
  const conferma =
    typeof showConfirmModal === "function" ? showConfirmModal : showModal;
  const nome = ids.length === 1 ? cfg.singolare : cfg.plurale;

  conferma(
    "Conferma Eliminazione Multipla",
    `Sei sicuro di voler eliminare ${ids.length} ${nome}? ${cfg.avviso} L'operazione non può essere annullata.`,
    () => bulkEseguiEliminazione(entity, ids),
  );
}

async function bulkEseguiEliminazione(entity, ids) {
  const cfg = BULK_CONFIG[entity];
  try {
    const response = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Errore eliminazione multipla");

    const ok = data.eliminati.length;
    const ko = data.saltati.length;
    let msg = `✅ Eliminati ${ok} ${ok === 1 ? cfg.singolare : cfg.plurale}.`;
    if (ko > 0) {
      msg += ` ⚠️ Non eliminati (${ko}): ${data.saltati.map((s) => `${s.nome} — ${s.motivo}`).join("; ")}`;
    }
    showAlert(msg, ko === 0 ? "success" : ok > 0 ? "warning" : "error");
  } catch (error) {
    console.error("Errore eliminazione multipla:", error);
    showAlert(error.message || "Errore di connessione", "error");
  }
  bulkClear(entity);
  await cfg.ricarica();
}
