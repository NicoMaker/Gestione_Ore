const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./gestione_ore.sqlite');
module.exports = db;