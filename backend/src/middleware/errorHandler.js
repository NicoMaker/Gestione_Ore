// Middleware globale di gestione errori: risponde con { error: "..." }.
function errorHandler(err, _req, res, _next) {
  console.error("Errore:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Errore del server" });
}
module.exports = { errorHandler };
