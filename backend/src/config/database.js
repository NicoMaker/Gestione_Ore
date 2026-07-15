// Connessione SQLite, creazione schema e helper Promise (run/get/all).
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// La cartella db è sotto Backend/ (config è in Backend/src/config).
const dbDir = path.join(__dirname, "../../db");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, "gestione_ore.db");
const db = new sqlite3.Database(dbPath);

// ── Schema ──
db.serialize(() => {
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

  db.run(`
    CREATE TABLE IF NOT EXISTS interventi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      tipo_servizio TEXT,
      ore_utilizzate REAL DEFAULT 0,
      data_intervento DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(cliente_id) REFERENCES clienti(id)
    )
  `);
});

// ── Helper Promise: incapsulano le API a callback di sqlite3 ──
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

module.exports = { db, run, get, all };
