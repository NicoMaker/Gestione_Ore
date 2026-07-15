// Configurazione centralizzata da variabili d'ambiente.
const dotenv = require("dotenv");
dotenv.config();

if (!process.env.PORT) {
  console.warn("⚠️  PORT non definito in .env. Uso porta di default 3000.");
}

module.exports = {
  port: process.env.PORT || 3000,
};
