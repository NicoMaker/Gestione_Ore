// Logica di business dei clienti.
const repo = require("../repositories/clientiRepository.js");
const interventiRepo = require("../repositories/interventiRepository.js");
const { httpError } = require("../utils/httpError.js");

async function listClienti() {
  return repo.listClienti();
}

async function getCliente(id) {
  const cliente = await repo.getClienteById(id);
  if (!cliente) throw httpError(404, "Cliente non trovato");
  return cliente;
}

async function addCliente(body) {
  const ragione_sociale = body.ragione_sociale || "";
  const indirizzo = body.indirizzo || "";
  const email = body.email || "";
  const ore_acquistate = body.ore_acquistate || 0;

  if (!ragione_sociale && !indirizzo && !email && (!ore_acquistate || ore_acquistate == 0)) {
    throw httpError(400, "Inserisci almeno un dato per il cliente");
  }

  const acquistate = Number.parseFloat(ore_acquistate) || 0;
  const { lastID } = await repo.insertCliente({
    ragione_sociale: ragione_sociale || "Cliente senza nome",
    indirizzo,
    email,
    ore_acquistate: acquistate,
    ore_residue: acquistate,
  });
  return { id: lastID };
}

async function updateCliente(id, body) {
  const { ragione_sociale, indirizzo, email, ore_acquistate } = body;
  const acquistate = Number.parseFloat(ore_acquistate) || 0;

  const cliente = await repo.getClienteById(id);
  if (!cliente) throw httpError(404, "Cliente non trovato");

  const ore_usate = cliente.ore_acquistate - cliente.ore_residue;
  if (acquistate < ore_usate) {
    throw httpError(
      400,
      `Non puoi impostare ore acquistate (${acquistate}) inferiori alle ore già utilizzate (${ore_usate.toFixed(1)}). Minimo consentito: ${ore_usate.toFixed(1)} ore.`,
    );
  }

  let nuove_residue = acquistate - ore_usate;
  if (nuove_residue < 0) nuove_residue = 0;

  await repo.updateCliente(id, {
    ragione_sociale: ragione_sociale || "Cliente senza nome",
    indirizzo: indirizzo || "",
    email: email || "",
    ore_acquistate: acquistate,
    ore_residue: nuove_residue,
  });
}

async function deleteCliente(id) {
  await interventiRepo.deleteInterventiByCliente(id);
  await repo.deleteCliente(id);
}

async function deleteAll() {
  // Prima gli interventi (vincolo FK), poi i clienti.
  const { db } = require("../config/database.js");
  await new Promise((resolve, reject) =>
    db.run("DELETE FROM interventi", (e) => (e ? reject(e) : resolve())),
  );
  await repo.deleteAllClienti();
}

module.exports = {
  listClienti,
  getCliente,
  addCliente,
  updateCliente,
  deleteCliente,
  deleteAll,
};
