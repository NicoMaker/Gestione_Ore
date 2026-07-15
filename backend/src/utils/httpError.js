// Crea un Error con codice di stato HTTP, gestito dall'errorHandler/controller.
function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
module.exports = { httpError };
