// ============= REPORT · INFO CLIENTE =============
function updateClientInfo(data) {
  const { cliente, totaleUsato, percentualeUtilizzo } = data;

  // ✅ Aggiorna il titolo della pagina
  document.title = `Report Cliente ${cliente.ragione_sociale} - Assistenza`;

  // Update client details
  if (clientName)
    clientName.textContent = cliente.ragione_sociale || "Cliente senza nome";
  if (clientEmail) clientEmail.textContent = cliente.email || "-";
  if (clientAddress) clientAddress.textContent = cliente.indirizzo || "-";
  if (clientPurchasedHours)
    clientPurchasedHours.textContent = cliente.ore_acquistate.toFixed(1);
  if (clientUsedHours) clientUsedHours.textContent = totaleUsato.toFixed(1);
  if (clientRemainingHours)
    clientRemainingHours.textContent = cliente.ore_residue.toFixed(1);
  if (clientUsagePercentage)
    clientUsagePercentage.textContent = percentualeUtilizzo + "%";

  // Update status badge
  if (clientStatus) {
    clientStatus.className = "status-badge";

    const percentuale =
      (100 * (cliente.ore_acquistate - cliente.ore_residue)) /
      cliente.ore_acquistate;
    const percentualeText = percentuale.toFixed(1) + "%";

    switch (true) {
      case percentuale <= 70:
        clientStatus.classList.add("active");
        clientStatus.textContent = "Attivo)";
        break;
      case percentuale <= 85:
        clientStatus.classList.add("warning");
        clientStatus.textContent = "Attivo - Attenzione )";
        break;
      case percentuale < 100:
        clientStatus.classList.add("danger");
        clientStatus.textContent = "Attivo - Critico)";
        break;
      default:
        clientStatus.classList.add("danger");
        clientStatus.textContent = "Esaurito)";
        break;
    }
  }

  // Update progress bar
  if (progressFill) {
    progressFill.style.width = percentualeUtilizzo + "%";
  }
}
