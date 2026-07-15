// Accesso ai dati dei clienti.
const { run, get, all } = require("../config/database.js");

const listClienti = () =>
  all("SELECT * FROM clienti ORDER BY ragione_sociale");

const getClienteById = (id) =>
  get("SELECT * FROM clienti WHERE id = ?", [id]);

const insertCliente = ({ ragione_sociale, indirizzo, email, ore_acquistate, ore_residue }) =>
  run(
    "INSERT INTO clienti (ragione_sociale, indirizzo, email, ore_acquistate, ore_residue) VALUES (?, ?, ?, ?, ?)",
    [ragione_sociale, indirizzo, email, ore_acquistate, ore_residue],
  );

const updateCliente = (id, { ragione_sociale, indirizzo, email, ore_acquistate, ore_residue }) =>
  run(
    "UPDATE clienti SET ragione_sociale = ?, indirizzo = ?, email = ?, ore_acquistate = ?, ore_residue = ? WHERE id = ?",
    [ragione_sociale, indirizzo, email, ore_acquistate, ore_residue, id],
  );

const setOreResidue = (id, ore_residue) =>
  run("UPDATE clienti SET ore_residue = ? WHERE id = ?", [ore_residue, id]);

const addOreResidue = (id, delta) =>
  run("UPDATE clienti SET ore_residue = ore_residue + ? WHERE id = ?", [delta, id]);

const deleteCliente = (id) => run("DELETE FROM clienti WHERE id = ?", [id]);

const deleteAllClienti = () => run("DELETE FROM clienti");

module.exports = {
  listClienti,
  getClienteById,
  insertCliente,
  updateCliente,
  setOreResidue,
  addOreResidue,
  deleteCliente,
  deleteAllClienti,
};
