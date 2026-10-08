// Entry point del server.
const app = require("./src/app.js");
const { port } = require("./src/config/env.js");
const { db } = require("./src/config/database.js");

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Chiusura ordinata: chiude HTTP e poi il database SQLite.
function chiudi(segnale) {
  console.log(`\n${segnale} ricevuto: chiusura del server...`);
  server.close(() => db.close(() => process.exit(0)));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on("SIGINT", () => chiudi("SIGINT"));
process.on("SIGTERM", () => chiudi("SIGTERM"));
