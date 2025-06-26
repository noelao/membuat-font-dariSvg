const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const svg2ttf = require('svg2ttf');

const app = express();
const port = 3000;

// =================================================================
// KONFIGURASI DAN MIDDLEWARE
// =================================================================

// Konfigurasi EJS sebagai view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware untuk membaca data dari form (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Menyajikan folder public dan generated_fonts sebagai folder statis
app.use(express.static(path.join(__dirname, 'public')));
app.use('/fonts', express.static(path.join(__dirname, 'generated_fonts')));


// =================================================================
// FUNGSI HELPER UNTUK NORMALISASI PATH
// =================================================================

/**
 * Menganalisis data path SVG untuk menemukan kotak pembatasnya (bounding box).
 * Ini adalah versi sederhana untuk menangani perintah path umum.
 * @param {string} pathD - String data dari atribut 'd' sebuah path.
 * @returns {object} Objek berisi minX, minY, maxX, maxY, width, dan height.
 */
function getPathBoundingBox(pathD) {
    // Regex untuk memecah path menjadi perintah dan koordinatnya
    const commands = pathD.match(/[a-zA-Z][^a-zA-Z]*/g);
    if (!commands) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };

    let x = 0, y = 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Fungsi untuk memperbarui batas
    const updateBounds = (px, py) => {
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
    };

    commands.forEach(commandStr => {
        const command = commandStr[0];
        const args = (commandStr.slice(1).match(/-?\d+(\.\d+)?/g) || []).map(Number);
        
        let i = 0;
        while(i < args.length) {
            let px = x, py = y; // Posisi awal sebelum perintah
            switch(command) {
                // Perintah absolut
                case 'M': x = args[i++]; y = args[i++]; updateBounds(x,y); break;
                case 'L': x = args[i++]; y = args[i++]; updateBounds(x,y); break;
                case 'H': x = args[i++]; updateBounds(x,y); break;
                case 'V': y = args[i++]; updateBounds(x,y); break;
                case 'C': 
                    updateBounds(args[i], args[i+1]); 
                    updateBounds(args[i+2], args[i+3]);
                    x = args[i+4]; y = args[i+5]; updateBounds(x,y);
                    i += 6; break;
                // Perintah relatif
                case 'm': x += args[i++]; y += args[i++]; updateBounds(x,y); break;
                case 'l': x += args[i++]; y += args[i++]; updateBounds(x,y); break;
                // Perintah lain (sederhanakan untuk contoh ini)
                case 'z': case 'Z': break;
                default: i = args.length; // Lewati perintah yang tidak didukung
            }
        }
    });

    return {
        minX: minX === Infinity ? 0 : minX,
        minY: minY === Infinity ? 0 : minY,
        maxX: maxX === -Infinity ? 0 : maxX,
        maxY: maxY === -Infinity ? 0 : maxY,
        width: (maxX - minX) || 0,
        height: (maxY - minY) || 0
    };
}


/**
 * Menskalakan data path ke tinggi target yang diinginkan sambil menjaga rasio aspek.
 * @param {string} pathD - String data dari atribut 'd' sebuah path.
 * @param {number} targetHeight - Tinggi yang diinginkan dalam unit font.
 * @returns {string} String data 'd' baru yang telah dinormalisasi.
 */
function normalizePath(pathD, targetHeight) {
    const bbox = getPathBoundingBox(pathD);
    if (!bbox || bbox.height === 0) return pathD;

    const scaleFactor = targetHeight / bbox.height;

    let newPathD = '';
    const commands = pathD.match(/[a-zA-Z][^a-zA-Z]*/g) || [];

    commands.forEach(commandStr => {
        const command = commandStr[0];
        const args = (commandStr.slice(1).match(/-?\d+(\.\d+)?/g) || []).map(Number);
        
        // Skalakan semua argumen numerik
        const scaledArgs = args.map(arg => parseFloat((arg * scaleFactor).toFixed(2)));
        
        newPathD += command + scaledArgs.join(' ') + ' ';
    });

    return newPathD.trim();
}

// =================================================================
// ROUTES / ENDPOINTS APLIKASI
// =================================================================

// Route untuk halaman utama
app.get('/', (req, res) => {
    res.render('index');
});

/**
 * Route utama untuk membuat font.
 * Semua logika pembuatan font ada di dalam sini.
 */
app.post('/create-font', (req, res) => {
    // 1. Ambil nama font dari form
    const fontName = req.body.fontName.replace(/\s+/g, '') || 'MyFont'; 
    const fontFileName = `${fontName}.ttf`;
    const outputPath = path.join(__dirname, 'generated_fonts', fontFileName);

    // 2. Definisikan data glyph mentah beserta target tingginya
    const glyphsData = [
        { unicode: 'A', glyphName: 'A', path: 'M256 768L0 0H512L256 768Z', targetHeight: 800 },
        { unicode: 'B', glyphName: 'B', path: 'M0 0H256C384 0 512 128 512 256S384 512 256 512H0V0ZM128 128V384H256C320 384 384 320 384 256S320 128 256 128H128Z M0 512H256C448 512 512 608 512 768S448 1024 256 1024H0V512ZM128 640V896H256C320 896 384 832 384 768S320 640 256 640H128Z', targetHeight: 800 },
        { unicode: 'C', glyphName: 'C', path: 'M512 256C512 128 384 0 256 0S0 128 0 256V768C0 896 128 1024 256 1024S512 896 512 768V640H384V768C384 832 320 896 256 896S128 832 128 768V256C128 192 192 128 256 128S384 192 384 256V384H512V256Z', targetHeight: 800 },
        { unicode: 'c', glyphName: 'c', 
            path: "M 0 128 V 64 L 16 48 V 112 M 32 80 V 32 L 48 16 V 96 M 64 112 V 16 L 80 32 V 128 M 96 112 V 16 L 112 32 V 112 M 128 112 V 48 L 144 64 V 128 M 0 60 L 48 12 V 16 L 0 64 M 32 84 L 80 132 v -4 L 32 80 M 64 16 L 112 64 v -4 L 64 12 M 96 16 L 144 64 v -4 L 96 12",
            targetHeight: 550 }
    ];

    // 3. Lakukan proses normalisasi untuk setiap glyph
    const normalizedGlyphs = glyphsData.map(glyph => {
        console.log(`Normalizing glyph: ${glyph.glyphName} to target height ${glyph.targetHeight}`);
        const normalizedPathD = normalizePath(glyph.path, glyph.targetHeight);
        
        return {
            unicode: glyph.unicode,
            glyphName: glyph.glyphName,
            path: normalizedPathD // Gunakan path yang sudah dinormalisasi
        };
    });

    // 4. Buat string SVG Font dari data glyphs yang sudah dinormalisasi
    // units-per-em: "Kanvas" utama font. 1024 adalah nilai umum.
    // ascent: Batas atas untuk huruf kapital (sesuai targetHeight).
    // descent: Batas bawah untuk huruf seperti 'g' atau 'y'.
    let svgFont = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg><defs><font id="${fontName}" horiz-adv-x="600"><font-face units-per-em="1024" ascent="800" descent="-224" /><missing-glyph horiz-adv-x="512" />`;

    // Gunakan data yang sudah dinormalisasi untuk membangun font
    normalizedGlyphs.forEach(glyph => {
        const unicodeHex = glyph.unicode.charCodeAt(0).toString(16);
        svgFont += `<glyph unicode="&#x${unicodeHex};" glyph-name="${glyph.glyphName}" d="${glyph.path}" horiz-adv-x="600" />`;
    });

    svgFont += `</font></defs></svg>`;
    
    // 5. Konversi string SVG Font menjadi buffer TTF
    const ttf = svg2ttf(svgFont, {});
    
    // 6. Simpan buffer TTF ke file
    fs.writeFileSync(outputPath, Buffer.from(ttf.buffer));

    console.log(`Font berhasil dibuat: ${fontFileName}`);
    
    // 7. Render halaman sukses dan kirim nama file ke EJS
    res.render('success', { fontFileName: fontFileName });
});


// Route untuk halaman tambahan (jika diperlukan)
app.get('/coba', (req, res) => {
    res.render("coba");
});
app.get('/buat', (req, res) => {
    res.render("buat");
});

// Route untuk mengunduh file font yang telah dibuat
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'generated_fonts', req.params.filename);
    res.download(filePath, (err) => {
        if(err) {
            console.error("Error saat mengunduh file:", err);
            res.status(404).send("File tidak ditemukan.");
        }
    });
});


// =================================================================
// MULAI SERVER
// =================================================================
app.listen(port, () => {
    console.log(`Aplikasi berjalan di http://localhost:${port}`);
});

