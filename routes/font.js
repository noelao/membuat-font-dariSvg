const express = require('express');
const fnt = express.Router();

// import utils
const { 
    tulis,
    bacaFolder,
    loadIni
} = require("../penulisData/saya")
// import utils


fnt.get("/", (req, res) => {
    bacaFolder();
    res.render("buat")
})
fnt.get("/buat", (req, res) => {
    bacaFolder();
    res.render("buat")
})



fnt.get("/dari/:nama", async (req, res) => {
    const nama = req.params.nama;

    const data = await loadIni(nama);
    const kiriman = {
        data
    }
    res.render('tampilkan', kiriman);
})


module.exports = fnt;