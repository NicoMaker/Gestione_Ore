const express = require("express");
const router = express.Router();
const db = require("../db");

// Add intervention
router.post("/add_intervento", (req, res) => {
  console.log("Received intervention data:", req.body);

  const { cliente_id, tipo_servizio, ore_utilizzate } = req.body;

  // Validation
  if (!cliente_id || isNaN(cliente_id)) {
    return res.status(400).json({ error: "ID cliente non valido" });
  }

  if (!tipo_servizio || tipo_servizio.trim() === "") {
    return res.status(400).json({ error: "Tipo servizio è obbligatorio" });
  }

  if (
    !ore_utilizzate ||
    isNaN(ore_utilizzate) ||
    Number.parseFloat(ore_utilizzate) <= 0
  ) {
    return res
      .status(400)
      .json({ error: "Ore utilizzate deve essere un numero maggiore di 0" });
  }

  const oreUtilizzateNum = Number.parseFloat(ore_utilizzate);
  const tipoServizioClean = tipo_servizio.trim();

  // Check client exists and has enough hours
  db.get(
    "SELECT ore_residue FROM clienti WHERE id = ?",
    [cliente_id],
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Errore database: " + err.message });
      }

      if (!row) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }

      if (oreUtilizzateNum > row.ore_residue) {
        return res.status(400).json({
          error: `Ore insufficienti. Disponibili: ${row.ore_residue.toFixed(1)} ore, richieste: ${oreUtilizzateNum.toFixed(1)} ore`,
        });
      }

      // Insert intervention
      db.run(
        "INSERT INTO interventi (cliente_id, tipo_servizio, ore_utilizzate) VALUES (?, ?, ?)",
        [cliente_id, tipoServizioClean, oreUtilizzateNum],
        function (err) {
          if (err) {
            console.error("Error inserting intervention:", err);
            return res.status(500).json({
              error: "Errore nell'inserimento dell'intervento: " + err.message,
            });
          }

          console.log("Intervention inserted with ID:", this.lastID);

          // Update client remaining hours
          db.run(
            "UPDATE clienti SET ore_residue = ore_residue - ? WHERE id = ?",
            [oreUtilizzateNum, cliente_id],
            (err2) => {
              if (err2) {
                console.error("Error updating client hours:", err2);
                return res.status(500).json({
                  error:
                    "Errore nell'aggiornamento delle ore cliente: " +
                    err2.message,
                });
              }

              console.log("Client hours updated successfully");
              res.json({
                success: true,
                id: this.lastID,
                message: "Intervento registrato con successo",
              });
            },
          );
        },
      );
    },
  );
});

// Update intervention
router.put("/api/interventi/:id", (req, res) => {
  const { tipo_servizio, ore_utilizzate } = req.body;
  const interventoId = req.params.id;

  // Validation
  if (!tipo_servizio || tipo_servizio.trim() === "") {
    return res.status(400).json({ error: "Tipo servizio è obbligatorio" });
  }

  if (
    !ore_utilizzate ||
    isNaN(ore_utilizzate) ||
    Number.parseFloat(ore_utilizzate) <= 0
  ) {
    return res
      .status(400)
      .json({ error: "Ore utilizzate deve essere un numero maggiore di 0" });
  }

  const oreUtilizzateNum = Number.parseFloat(ore_utilizzate);
  const tipoServizioClean = tipo_servizio.trim();

  // Get current intervention data
  db.get(
    "SELECT i.ore_utilizzate, i.cliente_id, c.ore_residue FROM interventi i JOIN clienti c ON i.cliente_id = c.id WHERE i.id = ?",
    [interventoId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: "Intervento non trovato" });
      }

      const differenza = oreUtilizzateNum - row.ore_utilizzate;
      const nuove_residue = row.ore_residue - differenza;

      if (nuove_residue < 0) {
        return res.status(400).json({
          error: `Ore insufficienti. Disponibili: ${(row.ore_residue + row.ore_utilizzate).toFixed(1)} ore totali`,
        });
      }

      // Update intervention
      db.run(
        "UPDATE interventi SET tipo_servizio = ?, ore_utilizzate = ? WHERE id = ?",
        [tipoServizioClean, oreUtilizzateNum, interventoId],
        (err2) => {
          if (err2) {
            return res.status(500).json({ error: err2.message });
          }

          // Update client remaining hours
          db.run(
            "UPDATE clienti SET ore_residue = ? WHERE id = ?",
            [nuove_residue, row.cliente_id],
            (err3) => {
              if (err3) {
                return res.status(500).json({ error: err3.message });
              }
              res.json({
                success: true,
                message: "Intervento aggiornato con successo",
              });
            },
          );
        },
      );
    },
  );
});

// Delete intervention
router.delete("/api/interventi/:id", (req, res) => {
  const interventoId = req.params.id;

  // Get intervention data before deletion
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

      // Delete intervention
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

module.exports = router;
