const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const clientiRoutes = require('./routes/clienti');
const interventiRoutes = require('./routes/interventi');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use('/', clientiRoutes);
app.use('/', interventiRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server avviato su http://localhost:${PORT}`));