// Assemblaggio dell'app Express: middleware, static, route, pagine, errori.
const express = require("express");
const path = require("path");
const multer = require("multer");

const routes = require("./routes/index.js");
const { errorHandler } = require("./middleware/errorHandler.js");

const app = express();
const upload = multer(); // parsing multipart/form-data senza file

// ── Middleware ──
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(upload.none());

// ── File statici del frontend ──
app.use("/css", express.static(path.join(__dirname, "../../frontend/css")));
app.use("/js", express.static(path.join(__dirname, "../../frontend/js")));

// ── Health check ──
app.get("/health", (_req, res) =>
  res.json({ status: "OK", uptime: Math.floor(process.uptime()) }),
);

// ── Route API/app ──
app.use("/", routes);

// ── Pagina principale ──
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html", "index.html"));
});

// ── Error handler (ultimo) ──
app.use(errorHandler);

module.exports = app;
