const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/interventiController.js");

router.post("/add_intervento", ctrl.add);
router.put("/api/interventi/:id", ctrl.update);
router.delete("/api/interventi/:id", ctrl.remove);

module.exports = router;
