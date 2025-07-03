// routes/report.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Pagina di stampa dettaglio cliente
router.get('/report_cliente/:id', (req, res) => {
    const clienteId = req.params.id;
    const queryCliente = 'SELECT * FROM clienti WHERE id = ?';
    const queryInterventi = 'SELECT * FROM interventi WHERE cliente_id = ?';

    db.get(queryCliente, [clienteId], (err, cliente) => {
        if (err) return res.status(500).send("Errore cliente");
        db.all(queryInterventi, [clienteId], (err2, interventi) => {
            if (err2) return res.status(500).send("Errore interventi");

            const totaleUsato = interventi.reduce((acc, intv) => acc + intv.ore_utilizzate, 0);

            let html = `
                <html><head><title>Report Cliente</title>
                <style>
                body { font-family: sans-serif; padding: 2rem; }
                h1 { margin-bottom: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th, td { border: 1px solid #ccc; padding: 8px; }
                th { background: #f0f0f0; }
                </style>
                </head><body>
                <h1>Report per ${cliente.ragione_sociale}</h1>
                <p>Email: ${cliente.email}<br>Indirizzo: ${cliente.indirizzo}</p>
                <table>
                <thead><tr><th>Tipo Servizio</th><th>Ore Utilizzate</th></tr></thead>
                <tbody>
                    ${interventi.map(i => `<tr><td>${i.tipo_servizio}</td><td>${i.ore_utilizzate}</td></tr>`).join('')}
                    <tr><td><strong>TOTALE</strong></td><td><strong>${totaleUsato}</strong></td></tr>
                </tbody>
                </table>
                <br><button onclick="window.print()">Stampa</button>
                </body></html>
            `;
            res.send(html);
        });
    });
});

module.exports = router;
