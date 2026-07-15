// Avvolge un handler async e inoltra gli errori a next() (→ errorHandler).
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
module.exports = { asyncHandler };
