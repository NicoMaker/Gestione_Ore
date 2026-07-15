// Logica di business del report cliente.
const clientiRepo = require("../repositories/clientiRepository.js");
const interventiRepo = require("../repositories/interventiRepository.js");
const { httpError } = require("../utils/httpError.js");

async function getReport(clienteId) {
  const cliente = await clientiRepo.getClienteById(clienteId);
  if (!cliente) throw httpError(404, "Cliente non trovato");

  const interventi = await interventiRepo.listInterventiByCliente(clienteId);
  const totaleUsato = interventi.reduce((acc, i) => acc + i.ore_utilizzate, 0);

  return {
    cliente,
    interventi,
    totaleUsato,
    percentualeUtilizzo:
      cliente.ore_acquistate > 0
        ? ((totaleUsato / cliente.ore_acquistate) * 100).toFixed(1)
        : 0,
  };
}

async function getIntervento(id) {
  const intervento = await interventiRepo.getInterventoConCliente(id);
  if (!intervento) throw httpError(404, "Intervento non trovato");
  return { success: true, intervento };
}

module.exports = { getReport, getIntervento };
