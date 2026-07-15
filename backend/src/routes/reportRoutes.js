const express = require("express");
const router = express.Router();
const reportCtrl = require("../controllers/reportController.js");
const interventiCtrl = require("../controllers/interventiController.js");

router.get("/report_cliente/:id", reportCtrl.page);
router.get("/api/report_cliente/:id", reportCtrl.getReport);
router.get("/api/interventi/:id", reportCtrl.getIntervento);
router.delete("/api/clienti/:id/interventi", interventiCtrl.removeAllByCliente);

module.exports = router;
