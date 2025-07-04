const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const multer = require("multer")
const dotenv = require("dotenv")
const app = express()

dotenv.config()

// Configure multer for form data parsing
const upload = multer()

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(upload.none()) // For parsing multipart/form-data without files
app.use("/css", express.static(path.join(__dirname, "public/css")))
app.use("/js", express.static(path.join(__dirname, "public/js")))
app.use("/assets", express.static(path.join(__dirname, "public/assets")))

// Routes
const clientiRoutes = require("./routes/clienti")
const interventiRoutes = require("./routes/interventi")
const reportRoutes = require("./routes/report")

app.use("/", clientiRoutes)
app.use("/", interventiRoutes)
app.use("/", reportRoutes)

// Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"))
})

app.get("/contratti", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "contratti.html"))
})

!process.env.PORT
  ? console.warn("⚠️  PORT non definito in .env. Uso porta di default 3000.")
  : console.log("Porta: " + process.env.PORT);

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
