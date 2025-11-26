const express = require('express');
const api = express.Router();

// import utils
const { 
    tulis,
    bacaFolder,
    loadIni,
    tambahData
} = require("../penulisData/saya");
const {
    ambilPathBerapa,
    ambilJudulId,
    updateKumpulanPath
} = require("../utils/tulis");
const {
    authSession
} = require("../utils/auth");
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


api.get("/judul-table", authSession, async (req, res) => {
    const data = await ambilPathBerapa();
    res.json(data);
})
api.get("/ambil-dengan/:id", authSession, async (req, res) => {
    const id = req.params.id;

    const data = await ambilJudulId(id);
    res.json(data);
})

api.post("/tambahkan-path/:id", authSession, async (req, res) => {
    const id = req.params.id;
    const calonData = req.body;

    const data = await ambilJudulId(id);
    calonData.id = data.kumpulan[data.kumpulan.length-1].id + 1;

    data.kumpulan.push(calonData);
    const gabunganData = data.kumpulan;

    const dataBaru = updateKumpulanPath(gabunganData, id);

    res.json({success:true, json: dataBaru});
})


module.exports = api;