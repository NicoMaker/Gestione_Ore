const express = require('express');
const router = express.Router();
const db = require('../db');

// Home + view
router.get('/', (req, res) => {
  db.all('SELECT id, ragione_sociale FROM clienti', [], (err, clienti) => {
    if (err) throw err;
    db.all('SELECT * FROM clienti', [], (err2, clienti_full) => {
      if (err2) throw err2;
      res.render('index', { clienti, clienti_full, error: null });
    });
  });
});

// Aggiungi cliente
router.post('/add_cliente', (req, res) => {
  const { ragione_sociale, indirizzo, email, ore_acquistate } = req.body;
  const ore_residue = ore_acquistate;
  db.run('INSERT INTO clienti (ragione_sociale, indirizzo, email, ore_acquistate, ore_residue) VALUES (?, ?, ?, ?, ?)',
    [ragione_sociale, indirizzo, email, ore_acquistate, ore_residue],
    err => {
      if (err) throw err;
      res.redirect('/');
    });
});

// Elimina cliente
router.post('/delete_cliente/:id', (req, res) => {
  db.run('DELETE FROM clienti WHERE id = ?', [req.params.id], function (err) {
    if (err) throw err;
    res.redirect('/');
  });
});

// Modifica cliente
router.post('/update_cliente/:id', (req, res) => {
  const { ragione_sociale, indirizzo, email, ore_acquistate } = req.body;
  db.get('SELECT ore_residue FROM clienti WHERE id = ?', [req.params.id], (err, row) => {
    if (err) throw err;
    const delta = ore_acquistate - row.ore_residue;
    db.run('UPDATE clienti SET ragione_sociale=?, indirizzo=?, email=?, ore_acquistate=?, ore_residue=? WHERE id=?',
      [ragione_sociale, indirizzo, email, ore_acquistate, ore_acquistate - (row.ore_residue - delta), req.params.id],
      function (err2) {
        if (err2) throw err2;
        res.redirect('/');
      });
  });
});

router.get('/api/clienti', (req, res) => {
  db.all('SELECT * FROM clienti', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Elimina tutti i clienti e interventi
router.post('/delete_all', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM interventi');
    db.run('DELETE FROM clienti');
    res.status(200).send('Tutti i dati eliminati');
  });
});


module.exports = router;