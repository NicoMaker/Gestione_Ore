const fs = require("fs")
const path = require("path")
const sqlite3 = require("sqlite3").verbose()

// Assicurati che la cartella "db" esista
const dbDir = path.join(__dirname, "db")
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir)
}

// Percorso completo del database
const dbPath = path.join(dbDir, "gestione_ore.db")

const db = new sqlite3.Database(dbPath)

// Create tables if they don't exist
db.serialize(() => {
    // Clients table
    db.run(`
        CREATE TABLE IF NOT EXISTS clienti (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ragione_sociale TEXT NOT NULL,
            indirizzo TEXT,
            email TEXT,
            ore_acquistate REAL DEFAULT 0,
            ore_residue REAL DEFAULT 0
        )
    `)

    // Interventions table
    db.run(`
        CREATE TABLE IF NOT EXISTS interventi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            tipo_servizio TEXT,
            ore_utilizzate REAL DEFAULT 0,
            data_intervento DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(cliente_id) REFERENCES clienti(id)
        )
    `)
})

module.exports = db
