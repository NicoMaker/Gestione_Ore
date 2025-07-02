const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/add_intervento', (req, res) => {
  const { cliente_id, tipo_servizio, ore_utilizzate } = req.body;

  db.get('SELECT ore_residue FROM clienti WHERE id = ?', [cliente_id], (err, row) => {
    if (err) throw err;
    if (!row || ore_utilizzate > row.ore_residue) {
      return res.redirect('/?error=Ore insufficenti');
    }

    db.run('INSERT INTO interventi (cliente_id, tipo_servizio, ore_utilizzate) VALUES (?, ?, ?)',
      [cliente_id, tipo_servizio, ore_utilizzate],
      function(err) {
        if (err) throw err;
        db.run('UPDATE clienti SET ore_residue = ore_residue - ? WHERE id = ?',
          [ore_utilizzate, cliente_id],
          function(err2) {
            if (err2) throw err2;
            res.redirect('/');
          });
      });
  });
});

module.exports = router;