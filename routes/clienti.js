const express = require("express")
const router = express.Router()
const db = require("../db")

// Add client
router.post("/add_cliente", (req, res) => {
  console.log("Received data:", req.body)
  console.log("Headers:", req.headers)

  const ragione_sociale = req.body.ragione_sociale || ""
  const indirizzo = req.body.indirizzo || ""
  const email = req.body.email || ""
  const ore_acquistate = req.body.ore_acquistate || 0

  console.log("Extracted values:", { ragione_sociale, indirizzo, email, ore_acquistate })

  // Validate that we have some data
  if (!ragione_sociale && !indirizzo && !email && (!ore_acquistate || ore_acquistate == 0)) {
    console.log("No data provided")
    return res.status(400).json({ error: "Inserisci almeno un dato per il cliente" })
  }

  const ore_residue = Number.parseFloat(ore_acquistate) || 0

  db.run(
    "INSERT INTO clienti (ragione_sociale, indirizzo, email, ore_acquistate, ore_residue) VALUES (?, ?, ?, ?, ?)",
    [
      ragione_sociale || "Cliente senza nome",
      indirizzo || "",
      email || "",
      Number.parseFloat(ore_acquistate) || 0,
      ore_residue,
    ],
    function (err) {
      if (err) {
        console.error("Database error:", err)
        return res.status(500).json({ error: "Errore database: " + err.message })
      }
      console.log("Successfully inserted client with ID:", this.lastID)
      res.json({ success: true, id: this.lastID })
    },
  )
})

// Delete client
router.post("/delete_cliente/:id", (req, res) => {
  const clienteId = req.params.id

  // Prima elimina gli interventi associati
  db.run("DELETE FROM interventi WHERE cliente_id = ?", [clienteId], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    // Poi elimina il cliente
    db.run("DELETE FROM clienti WHERE id = ?", [clienteId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.json({ success: true })
    })
  })
})

// Update client
router.post("/update_cliente/:id", (req, res) => {
  const { ragione_sociale, indirizzo, email, ore_acquistate } = req.body
  const clienteId = req.params.id

  const ore_acquistate_num = Number.parseFloat(ore_acquistate) || 0

  db.get("SELECT ore_acquistate, ore_residue FROM clienti WHERE id = ?", [clienteId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!row) {
      return res.status(404).json({ error: "Cliente non trovato" })
    }

    const ore_usate = row.ore_acquistate - row.ore_residue

    // VALIDAZIONE: Non permettere di impostare ore acquistate minori delle ore già utilizzate
    if (ore_acquistate_num < ore_usate) {
      return res.status(400).json({
        error: `Non puoi impostare ore acquistate (${ore_acquistate_num}) inferiori alle ore già utilizzate (${ore_usate.toFixed(1)}). Minimo consentito: ${ore_usate.toFixed(1)} ore.`,
      })
    }

    let nuove_ore_residue = ore_acquistate_num - ore_usate
    if (nuove_ore_residue < 0) nuove_ore_residue = 0

    db.run(
      "UPDATE clienti SET ragione_sociale = ?, indirizzo = ?, email = ?, ore_acquistate = ?, ore_residue = ? WHERE id = ?",
      [
        ragione_sociale || "Cliente senza nome",
        indirizzo || "",
        email || "",
        ore_acquistate_num,
        nuove_ore_residue,
        clienteId,
      ],
      (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2.message })
        }
        res.json({ success: true })
      },
    )
  })
})

// API clients
router.get("/api/clienti", (req, res) => {
  db.all("SELECT * FROM clienti ORDER BY ragione_sociale", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

// Get single client
router.get("/api/clienti/:id", (req, res) => {
  db.get("SELECT * FROM clienti WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (!row) {
      return res.status(404).json({ error: "Cliente non trovato" })
    }
    res.json(row)
  })
})

// Delete all data
router.post("/delete_all", (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM interventi", (err) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      db.run("DELETE FROM clienti", (err) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        res.json({ success: true, message: "Tutti i dati eliminati" })
      })
    })
  })
})

module.exports = router
