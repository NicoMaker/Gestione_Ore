// Assemblaggio dell'app Express: middleware, static, route, pagine, errori.
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");

const routes = require("./routes/index.js");
const { errorHandler } = require("./middleware/errorHandler.js");

const app = express();
const upload = multer(); // parsing multipart/form-data senza file

// ── Middleware ──
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(upload.none());

// ── File statici del frontend ──
app.use("/css", express.static(path.join(__dirname, "../../frontend/css")));
app.use("/js", express.static(path.join(__dirname, "../../frontend/js")));

// ── Route API/app ──
app.use("/", routes);

// ── Pagina principale ──
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html", "index.html"));
});

// ── Error handler (ultimo) ──
app.use(errorHandler);

module.exports = app;
