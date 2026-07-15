// Aggrega tutte le route mantenendo l'ordine di registrazione originale.
const express = require("express");
const router = express.Router();

router.use("/", require("./clientiRoutes.js"));
router.use("/", require("./interventiRoutes.js"));
router.use("/", require("./reportRoutes.js"));

module.exports = router;
