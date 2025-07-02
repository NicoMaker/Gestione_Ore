const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Routes
const clientiRoutes = require('./routes/clienti');
const interventiRoutes = require('./routes/interventi');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve file statici (es. style.css)

// Serve index.html da /views
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API routes
app.use('/', clientiRoutes);
app.use('/', interventiRoutes);

// Avvia server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});
