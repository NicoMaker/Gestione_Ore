const express = require("express")
const router = express.Router()
const db = require("../db")

router.post("/add_intervento", (req, res) => {
  const { cliente_id, tipo_servizio, ore_utilizzate } = req.body

  db.get("SELECT ore_residue FROM clienti WHERE id = ?", [cliente_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!row || Number.parseFloat(ore_utilizzate) > row.ore_residue) {
      return res.status(400).json({ error: "Ore insufficienti" })
    }

    db.run(
      "INSERT INTO interventi (cliente_id, tipo_servizio, ore_utilizzate) VALUES (?, ?, ?)",
      [cliente_id, tipo_servizio, ore_utilizzate],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }

        db.run(
          "UPDATE clienti SET ore_residue = ore_residue - ? WHERE id = ?",
          [ore_utilizzate, cliente_id],
          (err2) => {
            if (err2) {
              return res.status(500).json({ error: err2.message })
            }
            res.json({ success: true })
          },
        )
      },
    )
  })
})

module.exports = router
