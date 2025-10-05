const express = require('express');
const api = express.Router();

// import utils
const { 
    tulis,
    bacaFolder,
    loadIni,
    tambahData
} = require("../penulisData/saya")
// import utils


api.get("/", (req, res) => {
    bacaFolder();
    res.render("buat")
})

api.get("/fonts", async (req, res) => {
    const fonts = await bacaFolder();
    console.log(fonts);

    res.json(fonts)
})


api.get("/dari/:nama", async (req, res) => {
    const nama = req.params.nama;

    const data = await loadIni(nama);
    res.json(data);
})

api.post("/dari/:nama", async (req, res) => {
    const nama = req.params.nama;
    const dataPath = req.body;

    const dataSebelumnya = await loadIni(nama);
    console.log(dataSebelumnya.length)

    dataPath.id = parseInt(dataSebelumnya.length) + 1;
    tambahData(dataPath, nama);

    res.json({success:true});
})


module.exports = api;