const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve file statici (style.css, script.js)

// Routes
const clientiRoutes = require('./routes/clienti');
const interventiRoutes = require('./routes/interventi');
const reportRoutes = require('./routes/report');

app.use('/', clientiRoutes);
app.use('/', interventiRoutes);
app.use('/', reportRoutes);

// Pagina principale (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Avvio server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});
