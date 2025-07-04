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
            <form method="POST" action="/report_cliente/${clienteId}/elimina_intervento/${i.id}" data-confirm="Sei sicuro di voler eliminare questo intervento?" style="display:inline">
              <button type="submit" class="btn btn-danger btn-sm">Elimina</button>
            </form>
          </td>
        </tr>
      `).join('');

            let html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
              <meta charset="UTF-8">
              <title>Report Cliente</title>
              <link rel="stylesheet" href="/CSS/report.css">
            </head>
            <body>

              <a href="/" class="btn btn-secondary" style="margin-bottom: 1rem;">← Torna alla Home</a>

              <h1>Report Cliente: ${cliente.ragione_sociale}</h1>

              <div class="cliente-info">
                <p><strong>Email:</strong> ${cliente.email}</p>
                <p><strong>Indirizzo:</strong> ${cliente.indirizzo}</p>
                <p><strong>Ore acquistate:</strong> ${cliente.ore_acquistate}</p>
                <p><strong>Ore residue:</strong> ${cliente.ore_residue}</p>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Tipo Servizio</th>
                    <th>Ore Utilizzate</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  ${righe}
                  <tr>
                    <td><strong>TOTALE</strong></td>
                    <td><strong>${totaleUsato.toFixed(1)}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>

              <form method="POST" action="/report_cliente/${clienteId}/elimina_tutti_interventi" data-confirm="Confermi l'eliminazione di TUTTI gli interventi di questo cliente?">
                <button class="btn btn-secondary">Elimina Tutti gli Interventi</button>
              </form>

              <button class="print" onclick="window.print()">🖨️ Stampa</button>

              <!-- Modale di conferma -->
              <div id="confirmModal" class="modal hidden">
                <div class="modal-content">
                  <p id="confirmMessage">Sei sicuro?</p>
                  <div class="modal-actions">
                    <button id="confirmYes" class="btn btn-danger">Sì</button>
                    <button id="confirmNo" class="btn btn-secondary">Annulla</button>
                  </div>
                </div>
              </div>

              <script src="/JS/report.js">
              </script>

            </body>
            </html>
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
