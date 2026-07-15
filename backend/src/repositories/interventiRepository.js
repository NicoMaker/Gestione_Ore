// Accesso ai dati degli interventi.
const { run, get, all } = require("../config/database.js");

const getInterventoById = (id) =>
  get("SELECT * FROM interventi WHERE id = ?", [id]);

// Intervento + dati cliente (join), usato per validazioni e report.
const getInterventoConCliente = (id) =>
  get(
    `SELECT i.*, c.ore_acquistate, c.ore_residue, c.ragione_sociale
     FROM interventi i JOIN clienti c ON i.cliente_id = c.id
     WHERE i.id = ?`,
    [id],
  );

const insertIntervento = ({ cliente_id, tipo_servizio, ore_utilizzate }) =>
  run(
    "INSERT INTO interventi (cliente_id, tipo_servizio, ore_utilizzate) VALUES (?, ?, ?)",
    [cliente_id, tipo_servizio, ore_utilizzate],
  );

const updateIntervento = (id, { tipo_servizio, ore_utilizzate }) =>
  run(
    "UPDATE interventi SET tipo_servizio = ?, ore_utilizzate = ? WHERE id = ?",
    [tipo_servizio, ore_utilizzate, id],
  );

const deleteIntervento = (id) =>
  run("DELETE FROM interventi WHERE id = ?", [id]);

const deleteInterventiByCliente = (clienteId) =>
  run("DELETE FROM interventi WHERE cliente_id = ?", [clienteId]);

const listInterventiByCliente = (clienteId) =>
  all(
    `SELECT *, datetime(data_intervento, 'localtime') AS data_formattata
     FROM interventi WHERE cliente_id = ? ORDER BY data_intervento DESC`,
    [clienteId],
  );

// Somma ore degli altri interventi del cliente (escluso quello indicato).
const sumOreAltriInterventi = (clienteId, exceptId) =>
  get(
    `SELECT COALESCE(SUM(ore_utilizzate), 0) AS total_other_hours
     FROM interventi WHERE cliente_id = ? AND id != ?`,
    [clienteId, exceptId],
  );

module.exports = {
  getInterventoById,
  getInterventoConCliente,
  insertIntervento,
  updateIntervento,
  deleteIntervento,
  deleteInterventiByCliente,
  listInterventiByCliente,
  sumOreAltriInterventi,
};
