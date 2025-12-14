const express = require('express');
const path = require('path');
const fs = require('fs');
const fnt = express.Router();

// import utils
const { 
    tulis,
    bacaFolder,
    loadIni
} = require("../penulisData/saya");
const {
    authSession
} = require("../utils/auth");
const {
    generateTtfFromSvgPaths
} = require("../utils/jadikanFont")
const {
    ambilJudulId
} = require("../utils/tulis")
// import utils


const FONT_DIR = path.join(__dirname, '../generated_fonts');
if (!fs.existsSync(FONT_DIR)) {
    fs.mkdirSync(FONT_DIR);
    console.log(`Folder output '${FONT_DIR}' dibuat.`);
}


fnt.get("/", authSession, (req, res) => {
    bacaFolder();
    res.render("buat")
})
fnt.get("/buat", authSession, (req, res) => {
    bacaFolder();
    res.render("buat")
})

fnt.get("/buat-font/:id", async (req, res) => {
    const id = req.params.id;
    const data = await ambilJudulId(id);
    
    try {
        const ttfBuffer = generateTtfFromSvgPaths(data.kumpulan, data.judul);

        const outputFilePath = path.join(FONT_DIR, `${data.judul}.ttf`);
        fs.writeFileSync(outputFilePath, ttfBuffer);

        res.status(200).json({message: "done"});
    } catch(err){
        console.error('Error generating and saving font:', err);
        res.status(500).send('Gagal memproses pembuatan dan penyimpanan font.');

    }

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