const express = require("express")
const router = express.Router()
const db = require("../db")
const path = require("path")

// Show client report page
router.get("/report_cliente/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "../views", "report.html"))
})

// API: Get client report data
router.get("/api/report_cliente/:id", (req, res) => {
  const clienteId = req.params.id

  const queryCliente = "SELECT * FROM clienti WHERE id = ?"
  const queryInterventi = `
    SELECT *, datetime(data_intervento, 'localtime') as data_formattata 
    FROM interventi 
    WHERE cliente_id = ? 
    ORDER BY data_intervento DESC
  `

  db.get(queryCliente, [clienteId], (err, cliente) => {
    if (err) {
      return res.status(500).json({ error: "Errore nel caricamento del cliente" })
    }

    if (!cliente) {
      return res.status(404).json({ error: "Cliente non trovato" })
    }

    db.all(queryInterventi, [clienteId], (err2, interventi) => {
      if (err2) {
        return res.status(500).json({ error: "Errore nel caricamento degli interventi" })
      }

      const totaleUsato = interventi.reduce((acc, intv) => acc + intv.ore_utilizzate, 0)

      res.json({
        cliente: cliente,
        interventi: interventi,
        totaleUsato: totaleUsato,
        percentualeUtilizzo: cliente.ore_acquistate > 0 ? ((totaleUsato / cliente.ore_acquistate) * 100).toFixed(1) : 0,
      })
    })
  })
})

// Update intervention
router.put("/api/interventi/:id", (req, res) => {
  const { tipo_servizio, ore_utilizzate } = req.body
  const interventoId = req.params.id

  // Get current intervention data
  db.get(
    "SELECT i.ore_utilizzate, i.cliente_id, c.ore_residue FROM interventi i JOIN clienti c ON i.cliente_id = c.id WHERE i.id = ?",
    [interventoId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (!row) {
        return res.status(404).json({ error: "Intervento non trovato" })
      }

      const differenza = Number.parseFloat(ore_utilizzate) - row.ore_utilizzate
      const nuove_residue = row.ore_residue - differenza

      if (nuove_residue < 0) {
        return res.status(400).json({ error: "Ore insufficienti" })
      }

      // Update intervention
      db.run(
        "UPDATE interventi SET tipo_servizio = ?, ore_utilizzate = ? WHERE id = ?",
        [tipo_servizio, Number.parseFloat(ore_utilizzate), interventoId],
        (err2) => {
          if (err2) {
            return res.status(500).json({ error: err2.message })
          }

          // Update client remaining hours
          db.run("UPDATE clienti SET ore_residue = ? WHERE id = ?", [nuove_residue, row.cliente_id], (err3) => {
            if (err3) {
              return res.status(500).json({ error: err3.message })
            }
            res.json({ success: true })
          })
        },
      )
    },
  )
})

// Delete intervention
router.delete("/api/interventi/:id", (req, res) => {
  const interventoId = req.params.id

  // Get intervention data before deletion
  db.get("SELECT cliente_id, ore_utilizzate FROM interventi WHERE id = ?", [interventoId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!row) {
      return res.status(404).json({ error: "Intervento non trovato" })
    }

    // Delete intervention
    db.run("DELETE FROM interventi WHERE id = ?", [interventoId], (err2) => {
      if (err2) {
        return res.status(500).json({ error: err2.message })
      }

      // Restore hours to client
      db.run(
        "UPDATE clienti SET ore_residue = ore_residue + ? WHERE id = ?",
        [row.ore_utilizzate, row.cliente_id],
        (err3) => {
          if (err3) {
            return res.status(500).json({ error: err3.message })
          }
          res.json({ success: true })
        },
      )
    })
  })
})

module.exports = router
