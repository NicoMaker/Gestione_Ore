// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gestione_ore.sqlite');

// Creazione automatica delle tabelle se non esistono
db.serialize(() => {
    // Tabella clienti
    db.run(`
    CREATE TABLE IF NOT EXISTS clienti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ragione_sociale TEXT NOT NULL,
      indirizzo TEXT,
      email TEXT,
      ore_acquistate REAL DEFAULT 0,
      ore_residue REAL DEFAULT 0
    )
  `);

    // Tabella interventi
    db.run(`
    CREATE TABLE IF NOT EXISTS interventi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      tipo_servizio TEXT,
      ore_utilizzate REAL DEFAULT 0,
      FOREIGN KEY(cliente_id) REFERENCES clienti(id)
    )
  `);
});

// Esporta il database per l'utilizzo in altri moduli
module.exports = db;
