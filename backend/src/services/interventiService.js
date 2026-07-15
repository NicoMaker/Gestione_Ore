// Logica di business degli interventi (validazioni ore + aggiornamento residue).
const repo = require("../repositories/interventiRepository.js");
const clientiRepo = require("../repositories/clientiRepository.js");
const { httpError } = require("../utils/httpError.js");

function validaBase(tipo_servizio, ore_utilizzate) {
  if (!tipo_servizio || tipo_servizio.trim() === "") {
    throw httpError(400, "Tipo servizio è obbligatorio");
  }
  if (!ore_utilizzate || isNaN(ore_utilizzate) || Number.parseFloat(ore_utilizzate) <= 0) {
    throw httpError(400, "Ore utilizzate deve essere un numero maggiore di 0");
  }
}

async function addIntervento(body) {
  const { cliente_id, tipo_servizio, ore_utilizzate } = body;

  if (!cliente_id || isNaN(cliente_id)) {
    throw httpError(400, "ID cliente non valido");
  }
  validaBase(tipo_servizio, ore_utilizzate);

  const ore = Number.parseFloat(ore_utilizzate);
  const tipo = tipo_servizio.trim();

  const cliente = await clientiRepo.getClienteById(cliente_id);
  if (!cliente) throw httpError(404, "Cliente non trovato");

  if (ore > cliente.ore_residue) {
    throw httpError(
      400,
      `Ore insufficienti. Disponibili: ${cliente.ore_residue.toFixed(1)} ore, richieste: ${ore.toFixed(1)} ore`,
    );
  }

  const { lastID } = await repo.insertIntervento({
    cliente_id,
    tipo_servizio: tipo,
    ore_utilizzate: ore,
  });
  await clientiRepo.addOreResidue(cliente_id, -ore);

  return { id: lastID, message: "Intervento registrato con successo" };
}

async function updateIntervento(id, body) {
  const { tipo_servizio, ore_utilizzate } = body;
  validaBase(tipo_servizio, ore_utilizzate);

  const ore = Number.parseFloat(ore_utilizzate);
  const tipo = tipo_servizio.trim();

  const row = await repo.getInterventoConCliente(id);
  if (!row) throw httpError(404, "Intervento non trovato");

  const differenza = ore - row.ore_utilizzate;
  const nuove_residue = row.ore_residue - differenza;

  if (nuove_residue < 0) {
    throw httpError(
      400,
      `Ore insufficienti. Disponibili: ${(row.ore_residue + row.ore_utilizzate).toFixed(1)} ore totali`,
    );
  }

  await repo.updateIntervento(id, { tipo_servizio: tipo, ore_utilizzate: ore });
  await clientiRepo.setOreResidue(row.cliente_id, nuove_residue);

  return { message: "Intervento aggiornato con successo" };
}

async function deleteIntervento(id) {
  const row = await repo.getInterventoById(id);
  if (!row) throw httpError(404, "Intervento non trovato");

  await repo.deleteIntervento(id);
  await clientiRepo.addOreResidue(row.cliente_id, row.ore_utilizzate); // ripristina ore

  return { message: "Intervento eliminato con successo" };
}

async function deleteAllByCliente(clienteId) {
  const cliente = await clientiRepo.getClienteById(clienteId);
  if (!cliente) throw httpError(404, "Cliente non trovato");

  await repo.deleteInterventiByCliente(clienteId);
  await clientiRepo.setOreResidue(clienteId, cliente.ore_acquistate); // reset residue

  return { message: "Tutti gli interventi sono stati eliminati" };
}

module.exports = {
  addIntervento,
  updateIntervento,
  deleteIntervento,
  deleteAllByCliente,
};
