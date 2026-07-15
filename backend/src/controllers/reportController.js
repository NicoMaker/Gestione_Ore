// Controller report: pagina HTML + API dati.
const path = require("path");
const service = require("../services/reportService.js");
const { asyncHandler } = require("../middleware/asyncHandler.js");

module.exports = {
  // Pagina report (report.html)
  page: (_req, res) => {
    res.sendFile(path.join(__dirname, "../../../frontend/html", "report.html"));
  },

  getReport: asyncHandler(async (req, res) => {
    res.json(await service.getReport(req.params.id));
  }),

  getIntervento: asyncHandler(async (req, res) => {
    res.json(await service.getIntervento(req.params.id));
  }),
};
