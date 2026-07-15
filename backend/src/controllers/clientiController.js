// Controller clienti: HTTP → service.
const service = require("../services/clientiService.js");
const { asyncHandler } = require("../middleware/asyncHandler.js");

module.exports = {
  list: asyncHandler(async (_req, res) => {
    res.json(await service.listClienti());
  }),

  getOne: asyncHandler(async (req, res) => {
    res.json(await service.getCliente(req.params.id));
  }),

  add: asyncHandler(async (req, res) => {
    const { id } = await service.addCliente(req.body);
    res.json({ success: true, id });
  }),

  update: asyncHandler(async (req, res) => {
    await service.updateCliente(req.params.id, req.body);
    res.json({ success: true });
  }),

  remove: asyncHandler(async (req, res) => {
    await service.deleteCliente(req.params.id);
    res.json({ success: true });
  }),

  removeAll: asyncHandler(async (_req, res) => {
    await service.deleteAll();
    res.json({ success: true, message: "Tutti i dati eliminati" });
  }),
};
