// ============= REPORT · INTERVENTI (tabella, modifica, elimina) =============
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
function deleteIntervento(id) {
  // Cerca l'intervento corrente tra i dati caricati
  const intervento = clientData?.interventi?.find((i) => i.id === id);
  const nomeIntervento = intervento?.tipo_servizio || "intervento sconosciuto";

  showConfirmModal(
    "Conferma Eliminazione",
    `Sei sicuro di voler eliminare l'intervento: ${nomeIntervento}?`,
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
