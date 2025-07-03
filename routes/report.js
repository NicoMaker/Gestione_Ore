// routes/report.js COMPLETO E AGGIORNATO
const express = require('express');
const router = express.Router();
const db = require('../db');

// Mostra il report con lista interventi
router.get('/report_cliente/:id', (req, res) => {
  const clienteId = req.params.id;
  const queryCliente = 'SELECT * FROM clienti WHERE id = ?';
  const queryInterventi = 'SELECT * FROM interventi WHERE cliente_id = ?';

  db.get(queryCliente, [clienteId], (err, cliente) => {
    if (err || !cliente) return res.status(500).send("Errore cliente");

    db.all(queryInterventi, [clienteId], (err2, interventi) => {
      if (err2) return res.status(500).send("Errore interventi");

      const totaleUsato = interventi.reduce((acc, intv) => acc + intv.ore_utilizzate, 0);

      const righe = interventi.map(i => `
        <tr>
          <td>${i.tipo_servizio}</td>
          <td>${i.ore_utilizzate}</td>
          <td>
            <form method="POST" action="/report_cliente/${clienteId}/elimina_intervento/${i.id}" style="display:inline">
              <button type="submit" class="btn-mini">Elimina</button>
            </form>
          </td>
        </tr>
      `).join('');

      let html = `
        <html><head><title>Report Cliente</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
          .btn-mini { background: #dc2626; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
          .btn-mini:hover { background: #b91c1c; }
        </style>
        </head><body>
          <h1>Report per ${cliente.ragione_sociale}</h1>
          <p><strong>Email:</strong> ${cliente.email}<br><strong>Indirizzo:</strong> ${cliente.indirizzo}</p>

          <table>
            <thead><tr><th>Tipo Servizio</th><th>Ore Utilizzate</th><th>Azioni</th></tr></thead>
            <tbody>
              ${righe}
              <tr><td><strong>TOTALE</strong></td><td colspan="2"><strong>${totaleUsato}</strong></td></tr>
            </tbody>
          </table>

          <form method="POST" action="/report_cliente/${clienteId}/elimina_tutti_interventi" style="margin-top: 20px">
            <button class="btn-mini" style="background: #6b7280">Elimina Tutti gli Interventi</button>
          </form>

          <br><br><button onclick="window.print()">Stampa</button>
        </body></html>
      `;

      res.send(html);
    });
  });
});

// Elimina un singolo intervento
router.post('/report_cliente/:clienteId/elimina_intervento/:interventoId', (req, res) => {
  const { clienteId, interventoId } = req.params;
  db.get('SELECT ore_utilizzate FROM interventi WHERE id = ?', [interventoId], (err, row) => {
    if (err || !row) return res.redirect(`/report_cliente/${clienteId}`);
    const ore = row.ore_utilizzate;

    db.run('DELETE FROM interventi WHERE id = ?', [interventoId], err2 => {
      if (err2) return res.redirect(`/report_cliente/${clienteId}`);
      db.run('UPDATE clienti SET ore_residue = ore_residue + ? WHERE id = ?', [ore, clienteId], () => {
        res.redirect(`/report_cliente/${clienteId}`);
      });
    });
  });
});

// Elimina tutti gli interventi di un cliente
router.post('/report_cliente/:clienteId/elimina_tutti_interventi', (req, res) => {
  const { clienteId } = req.params;
  db.get('SELECT SUM(ore_utilizzate) as totale FROM interventi WHERE cliente_id = ?', [clienteId], (err, row) => {
    const totale = row && row.totale ? row.totale : 0;
    db.run('DELETE FROM interventi WHERE cliente_id = ?', [clienteId], err2 => {
      if (err2) return res.redirect(`/report_cliente/${clienteId}`);
      db.run('UPDATE clienti SET ore_residue = ore_residue + ? WHERE id = ?', [totale, clienteId], () => {
        res.redirect(`/report_cliente/${clienteId}`);
      });
    });
  });
});

module.exports = router;