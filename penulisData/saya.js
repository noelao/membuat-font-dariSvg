const fs = require('fs');
const fsPr = require('fs').promises;
const path = require('path');

const dirPath = './data/';
if(!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath);
}
const dirData = './data/ini.json';
if(!fs.existsSync(dirData)){
    fs.writeFileSync(dirData,

    '[{"id": "1","name": "kesepakatan jam tidur","created_at": "2025-06-19T09:05:43.672Z","author":{"id":"6","name":"suika"},"isi_chat":[{"id":"1","isi":"selamat siang bisa saya tidur sekarang?","oleh": {"id":"6","name":"suika"}}]}]',
    'utf-8'

    );
}

const bacaFolder = async () => {
    try {
        const datapath = path.join(__dirname, '../data');
        const files = await fsPr.readdir(datapath);

        const font = files
            .filter(ini => ini.toLowerCase().endsWith(".le")) // Lebih baik pakai endsWith untuk ekstensi
            .map(file => {
                return file; 
            });

        console.log("dari dalam fungsi:", font);
        return font;

    } catch(err) {
        console.log(err);
        return [];
    }
}

const cariId = async (id, namaTable) => {
    const datas = await loadIni(namaTable);
    const data = datas.find(
        (data) => data.id == id
    );
    return data;
}

const loadIni = async (namaTable) => {
    try {
        if(!fs.existsSync(`./data/${namaTable}.le`)){
            fs.writeFileSync(`./data/${namaTable}.le`,
                '[{"id": "1","path": "M 0 0 H 192 L 0 192 Z"}]',
                'utf-8'
            );

        } else {
            const ini = await fs.readFileSync(`./data/${namaTable}.le`);
            const data = JSON.parse(ini);
            return data;
        }
    } catch(err){
        console.log(err);
    }
}

const simpanIni = (data, namaTable) => {
    // ubah menjadi text
    fs.writeFileSync(
        `./data/${namaTable}.le`, JSON.stringify(data)
    );
    return data;
}

const simpanIniSendiri = async (data, namaTable) => {
    const datas = await loadIni(namaTable);
    const indexGrub = datas.findIndex(ini => ini.id === data.id);

    datas[indexGrub] = data;

    fs.writeFileSync(
        `./data/${namaTable}.le`, JSON.stringify(datas)
    );
    return data;
}

const tambahData = async (data, namaTable) => {
    const datas = await loadIni(namaTable);    // jadi json
    datas.push(data);
    simpanIni(datas, namaTable);
}


function tulis(){
    const saiki = new Date();
    console.log(saiki);
    return saiki;
}

module.exports = {
    tulis,
    loadIni, 
    tambahData,
    cariId,
    simpanIniSendiri,
    bacaFolder
}