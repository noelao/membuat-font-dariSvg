require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;



const expressLayouts = require('express-ejs-layouts');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Izinkan koneksi ke Supabase & Vercel
        connectSrc: ["'self'", "https://*.supabase.co", "https://vitals.vercel-insights.com"], 
        // Izinkan script dari Vercel
        scriptSrc: ["'self'", "'unsafe-inline'", "https://vercel.live", "https://*.supabase.co"],
        // Izinkan gambar (Vercel kadang pakai SVG untuk icon)
        imgSrc: ["'self'", "data:", "https://*.supabase.co", "https://vercel.com"],
        // Izinkan frame (jika pakai Vercel Preview Toolbar)
        frameSrc: ["'self'", "https://vercel.live"],
      },
    },
  })
);



app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/fonts', express.static(path.join(__dirname, 'generated_fonts')));

// middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());


// utils
const { authSession } = require("./utils/auth");
app.use(authSession, (req, res, next) => {
  console.log("ini dieksekusi ...")
  try {
    if(req.user){
      res.locals.currentUser = req.user;
      console.log("ada session")
    } else {
      res.locals.currentUser = null;
    }
  } catch (err){
    console.log(err)
    res.locals.currentUser = null;
  }
  next();
});


app.get('/', authSession, async (req, res) => {
    res.render('index');
});
app.get('/tambah', authSession, async (req, res) => {
    res.render('tambahkan');
});


const { bacaFolder } = require('./penulisData/saya');
const fontRoute = require('./routes/font');
const apiRoute = require('./routes/api');
const loginRoute = require('./routes/auth');

app.use('/font', fontRoute);
app.use('/api', apiRoute);
app.use('/auth', loginRoute);



app.listen(port, () => {
    console.log(`Aplikasi berjalan di http://localhost:${port}`);
});