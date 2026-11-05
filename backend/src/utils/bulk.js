// Helper eliminazione multipla: esegue `fn(id)` per ogni id, uno alla volta
// (SQLite + ripristino ore: niente operazioni in parallelo). Elimina quelli
// eliminabili e salta gli altri riportando il motivo.
const { httpError } = require("./httpError.js");

const MAX_ELEMENTI = 1000;

function normalizzaIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0)
    throw httpError(400, "Nessun elemento selezionato");
  if (ids.length > MAX_ELEMENTI)
    throw httpError(400, `Troppi elementi selezionati (massimo ${MAX_ELEMENTI})`);
  const validi = [...new Set(ids.map((x) => Number(x)))];
  if (validi.some((n) => !Number.isInteger(n) || n <= 0))
    throw httpError(400, "ID non valido nella selezione");
  return validi;
}

// etichetta(id) → nome leggibile (async) usato nel riepilogo dei saltati
async function eliminaMultipli(ids, fn, etichetta = async (id) => `#${id}`) {
  const lista = normalizzaIds(ids);
  const eliminati = [];
  const saltati = [];
  for (const id of lista) {
    let nome = `#${id}`;
    try {
      nome = (await etichetta(id)) || nome;
      await fn(id);
      eliminati.push(id);
    } catch (err) {
      saltati.push({ id, nome, motivo: err.message });
    }
  }
  return { success: true, eliminati, saltati };
}

module.exports = { eliminaMultipli };
