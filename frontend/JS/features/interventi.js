// ==================== INTERVENTI (ore + validazione) ====================
function updateMaxHours() {
  const selectedOption = clienteSelect.selectedOptions[0];
  if (selectedOption && selectedOption.dataset.oreResidue) {
    const maxHours = Number.parseFloat(selectedOption.dataset.oreResidue);
    oreUtilizzateInput.setAttribute("max", maxHours);
    oreUtilizzateInput.setAttribute(
      "title",
      `Massimo disponibile: ${maxHours.toFixed(1)} ore`,
    );

    // Clear any existing validation if hours are now valid
    if (
      oreUtilizzateInput.value &&
      Number.parseFloat(oreUtilizzateInput.value) <= maxHours
    ) {
      oreUtilizzateInput.setCustomValidity("");
    }
  } else {
    oreUtilizzateInput.removeAttribute("max");
    oreUtilizzateInput.removeAttribute("title");
  }
}
function validateInterventionHours() {
  const clienteId = document.getElementById("cliente_id_hidden")?.value;
  const oreUtilizzate = Number.parseFloat(oreUtilizzateInput.value);

  if (!clienteId) {
    oreUtilizzateInput.setCustomValidity("Seleziona prima un cliente");
    return false;
  }

  const cliente = clientiList.find((c) => String(c.id) === String(clienteId));
  if (!cliente) {
    oreUtilizzateInput.setCustomValidity("Cliente non trovato");
    return false;
  }

  const oreResidue = Number.parseFloat(cliente.ore_residue);

  if (isNaN(oreUtilizzate) || oreUtilizzate <= 0) {
    oreUtilizzateInput.setCustomValidity(
      "Inserisci un numero di ore valido maggiore di 0",
    );
    return false;
  }

  if (oreUtilizzate > oreResidue) {
    oreUtilizzateInput.setCustomValidity(
      `Ore insufficienti. Disponibili: ${oreResidue.toFixed(1)} ore`,
    );
    return false;
  }

  oreUtilizzateInput.setCustomValidity("");
  return true;
}
async function handleInterventoSubmit(e) {
  e.preventDefault();

  const formData = new FormData(formIntervento);
  // Prendi l'ID cliente dal campo hidden
  const clienteId = document.getElementById("cliente_id_hidden")?.value;
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
  const cliente = clientiList.find((c) => String(c.id) === String(clienteId));
  if (!cliente) {
    showAlert("Cliente non trovato", "error");
    return;
  }
  const oreResidue = Number.parseFloat(cliente.ore_residue);
  if (oreUtilizzate > oreResidue) {
    showAlert(
      `Ore insufficienti. Disponibili: ${oreResidue.toFixed(1)} ore`,
      "error",
    );
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
      if (document.getElementById("combo-clienti-input"))
        document.getElementById("combo-clienti-input").value = "";
      if (document.getElementById("cliente_id_hidden"))
        document.getElementById("cliente_id_hidden").value = "";
      caricaClienti();
    } else {
      showAlert(
        result.error || "Errore nella registrazione dell'intervento",
        "error",
      );
    }
  } catch (error) {
    console.error("Error adding intervention:", error);
    showAlert("Errore di connessione", "error");
  }
}
