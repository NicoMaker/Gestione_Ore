// Controller interventi: HTTP → service.
const service = require("../services/interventiService.js");
const { asyncHandler } = require("../middleware/asyncHandler.js");

module.exports = {
  add: asyncHandler(async (req, res) => {
    const result = await service.addIntervento(req.body);
    res.json({ success: true, ...result });
  }),

  update: asyncHandler(async (req, res) => {
    const result = await service.updateIntervento(req.params.id, req.body);
    res.json({ success: true, ...result });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await service.deleteIntervento(req.params.id);
    res.json({ success: true, ...result });
  }),

  removeAllByCliente: asyncHandler(async (req, res) => {
    const result = await service.deleteAllByCliente(req.params.id);
    res.json({ success: true, ...result });
  }),
};
