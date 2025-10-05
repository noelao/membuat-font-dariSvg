const express = require('express');
const path = require('path');

const app = express();
const port = 3000;


const expressLayouts = require('express-ejs-layouts');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main')
app.use(expressLayouts);
app.set('layout', 'layouts/main')



app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/fonts', express.static(path.join(__dirname, 'generated_fonts')));

// middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));




app.get('/', async (req, res) => {
    res.render('index');
});


const { bacaFolder } = require('./penulisData/saya');
const fontRoute = require('./routes/font');
const apiRoute = require('./routes/api');

app.use('/font', fontRoute);
app.use('/api', apiRoute);



app.listen(port, () => {
    console.log(`Aplikasi berjalan di http://localhost:${port}`);
});