const express = require('express');
const router = express.Router();
const db = require('../db');

// Aggiungi cliente
router.post('/add_cliente', (req, res) => {
  const { ragione_sociale, indirizzo, email, ore_acquistate } = req.body;
  const ore_residue = ore_acquistate;
  db.run(
    'INSERT INTO clienti (ragione_sociale, indirizzo, email, ore_acquistate, ore_residue) VALUES (?, ?, ?, ?, ?)',
    [ragione_sociale, indirizzo, email, ore_acquistate, ore_residue],
    err => {
      if (err) throw err;
      res.redirect('/');
    }
  );
});

// Elimina cliente
router.post('/delete_cliente/:id', (req, res) => {
  db.run('DELETE FROM clienti WHERE id = ?', [req.params.id], err => {
    if (err) throw err;
    res.redirect('/');
  });
});

// Modifica cliente (aggiornamento ore corretto)
router.post('/update_cliente/:id', (req, res) => {
  const { ragione_sociale, indirizzo, email, ore_acquistate } = req.body;
  const clienteId = req.params.id;

  db.get('SELECT ore_acquistate, ore_residue FROM clienti WHERE id = ?', [clienteId], (err, row) => {
    if (err) throw err;

    const ore_usate = row.ore_acquistate - row.ore_residue;

    let nuove_ore_residue;
    if (ore_usate <= 0) {
      nuove_ore_residue = ore_acquistate;
    } else {
      nuove_ore_residue = ore_acquistate - ore_usate;
    }

    if (nuove_ore_residue < 0) nuove_ore_residue = 0;

    db.run(
      'UPDATE clienti SET ragione_sociale = ?, indirizzo = ?, email = ?, ore_acquistate = ?, ore_residue = ? WHERE id = ?',
      [ragione_sociale, indirizzo, email, ore_acquistate, nuove_ore_residue, clienteId],
      err2 => {
        if (err2) throw err2;
        res.redirect('/');
      }
    );
  });
});

// API clienti
router.get('/api/clienti', (req, res) => {
  db.all('SELECT * FROM clienti', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Elimina tutto
router.post('/delete_all', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM interventi');
    db.run('DELETE FROM clienti');
    res.status(200).send('Tutti i dati eliminati');
  });
});

// 🔁 Ripristina ore residue = ore acquistate
router.post('/ripristina_ore/:id', (req, res) => {
  const id = req.params.id;
  db.run('UPDATE clienti SET ore_residue = ore_acquistate WHERE id = ?', [id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.sendStatus(200);
  });
});

module.exports = router;
