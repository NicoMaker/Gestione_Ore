const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/clientiController.js");

router.post("/add_cliente", ctrl.add);
router.post("/delete_cliente/:id", ctrl.remove);
router.post("/update_cliente/:id", ctrl.update);
router.get("/api/clienti", ctrl.list);
router.get("/api/clienti/:id", ctrl.getOne);
router.post("/delete_all", ctrl.removeAll);

module.exports = router;
