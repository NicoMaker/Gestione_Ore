const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");

// Show client report page
router.get("/report_cliente/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/HTML", "report.html"));
});

// API: Get client report data
router.get("/api/report_cliente/:id", (req, res) => {
  const clienteId = req.params.id;

  const queryCliente = "SELECT * FROM clienti WHERE id = ?";
  const queryInterventi = `
    SELECT *, datetime(data_intervento, 'localtime') as data_formattata 
    FROM interventi 
    WHERE cliente_id = ? 
    ORDER BY data_intervento DESC
  `;

  db.get(queryCliente, [clienteId], (err, cliente) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Errore nel caricamento del cliente" });
    }

    if (!cliente) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }

    db.all(queryInterventi, [clienteId], (err2, interventi) => {
      if (err2) {
        return res
          .status(500)
          .json({ error: "Errore nel caricamento degli interventi" });
      }

      const totaleUsato = interventi.reduce(
        (acc, intv) => acc + intv.ore_utilizzate,
        0,
      );

      res.json({
        cliente: cliente,
        interventi: interventi,
        totaleUsato: totaleUsato,
        percentualeUtilizzo:
          cliente.ore_acquistate > 0
            ? ((totaleUsato / cliente.ore_acquistate) * 100).toFixed(1)
            : 0,
      });
    });
  });
});

// API: Get single intervention data - NUOVA ROUTE
router.get("/api/interventi/:id", (req, res) => {
  const interventoId = req.params.id;

  const query = `
    SELECT i.*, c.ore_acquistate, c.ragione_sociale
    FROM interventi i
    JOIN clienti c ON i.cliente_id = c.id
    WHERE i.id = ?
  `;

  db.get(query, [interventoId], (err, intervento) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Errore nel caricamento dell'intervento" });
    }

    if (!intervento) {
      return res.status(404).json({ error: "Intervento non trovato" });
    }

    res.json({
      success: true,
      intervento: intervento,
    });
  });
});

// Delete intervention
router.delete("/api/interventi/:id", (req, res) => {
  const interventoId = req.params.id;

  db.get(
    "SELECT cliente_id, ore_utilizzate FROM interventi WHERE id = ?",
    [interventoId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: "Intervento non trovato" });
      }

      db.run("DELETE FROM interventi WHERE id = ?", [interventoId], (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }

        // Restore hours to client
        db.run(
          "UPDATE clienti SET ore_residue = ore_residue + ? WHERE id = ?",
          [row.ore_utilizzate, row.cliente_id],
          (err3) => {
            if (err3) {
              return res.status(500).json({ error: err3.message });
            }
            res.json({
              success: true,
              message: "Intervento eliminato con successo",
            });
          },
        );
      });
    },
  );
});

// Delete all interventions for a client
router.delete("/api/clienti/:id/interventi", (req, res) => {
  const clienteId = req.params.id;

  db.get(
    "SELECT ore_acquistate FROM clienti WHERE id = ?",
    [clienteId],
    (err, cliente) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!cliente) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }

      db.run(
        "DELETE FROM interventi WHERE cliente_id = ?",
        [clienteId],
        (err2) => {
          if (err2) {
            return res.status(500).json({ error: err2.message });
          }

          db.run(
            "UPDATE clienti SET ore_residue = ore_acquistate WHERE id = ?",
            [clienteId],
            (err3) => {
              if (err3) {
                return res.status(500).json({ error: err3.message });
              }
              res.json({
                success: true,
                message: "Tutti gli interventi sono stati eliminati",
              });
            },
          );
        },
      );
    },
  );
});

router.put("/api/interventi/:id", (req, res) => {
  const { tipo_servizio, ore_utilizzate } = req.body;
  const interventoId = req.params.id;

  if (!tipo_servizio || tipo_servizio.trim() === "") {
    return res.status(400).json({ error: "Il tipo servizio è obbligatorio" });
  }

  const oreNum = Number.parseFloat(ore_utilizzate);
  if (!oreNum || oreNum <= 0) {
    return res
      .status(400)
      .json({ error: "Le ore utilizzate devono essere maggiori di 0" });
  }

  // Ottieni info sull'intervento e cliente
  db.get(
    `SELECT i.ore_utilizzate, i.cliente_id, c.ore_acquistate
     FROM interventi i
     JOIN clienti c ON i.cliente_id = c.id
     WHERE i.id = ?`,
    [interventoId],
    (err, row) => {
      if (err || !row) {
        return res
          .status(500)
          .json({ error: "Errore nel recupero dati intervento/cliente" });
      }

      const oreAttuali = row.ore_utilizzate;

      // Calcola ore totali utilizzate da altri interventi del cliente
      db.get(
        `SELECT COALESCE(SUM(ore_utilizzate), 0) as total_other_hours
         FROM interventi
         WHERE cliente_id = ? AND id != ?`,
        [row.cliente_id, interventoId],
        (err2, otherHours) => {
          if (err2) {
            return res
              .status(500)
              .json({ error: "Errore nel calcolo delle ore" });
          }

          const totalOtherHours = otherHours.total_other_hours;
          const oreTotaliDisponibili = row.ore_acquistate - totalOtherHours;
          const oreEffettiveDisponibili = oreTotaliDisponibili + oreAttuali;

          if (oreNum > oreEffettiveDisponibili) {
            return res.status(400).json({
              error: `Ore eccedenti. Massimo disponibile: ${oreEffettiveDisponibili.toFixed(1)}`,
            });
          }

          const nuoveOreResidue = row.ore_acquistate - totalOtherHours - oreNum;

          // Aggiorna intervento
          db.run(
            `UPDATE interventi SET tipo_servizio = ?, ore_utilizzate = ? WHERE id = ?`,
            [tipo_servizio.trim(), oreNum, interventoId],
            (err3) => {
              if (err3) {
                return res
                  .status(500)
                  .json({ error: "Errore aggiornamento intervento" });
              }

              // Aggiorna ore residue cliente
              db.run(
                `UPDATE clienti SET ore_residue = ? WHERE id = ?`,
                [nuoveOreResidue, row.cliente_id],
                (err4) => {
                  if (err4) {
                    return res
                      .status(500)
                      .json({ error: "Errore aggiornamento ore cliente" });
                  }

                  return res.json({
                    success: true,
                    message: "Intervento aggiornato con successo",
                    data: {
                      ore_residue: nuoveOreResidue,
                      ore_utilizzate: oreNum,
                      tipo_servizio: tipo_servizio.trim(),
                    },
                  });
                },
              );
            },
          );
        },
      );
    },
  );
});

module.exports = router;
