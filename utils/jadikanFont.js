const fs = require('fs');
const svg2ttf = require('svg2ttf');

/**
 * Merangkai string XML SVG Font dari array objek input, lalu mengonversinya ke format TTF.
 * * Struktur Input yang Diharapkan:
 * [{ 
 * id: string, 
 * path: string, 
 * ukuran: [string, string], // [lebar, tinggi]
 * catatan: string // Karakter yang akan diwakilkan (misalnya 'A', 'B', 'S')
 * }, ...]
 * * @param {Array<Object>} inputPaths Array data path SVG
 * @param {string} fontName Nama font yang akan dibuat
 * @returns {Buffer} Buffer data font TTF
 */
function generateTtfFromSvgPaths(inputPaths, fontName = 'CustomIconFont') {
    console.log(inputPaths);
    
    // Asumsi: Semua ikon menggunakan unit horiz-adv-x yang sama (1000)
    // Walaupun ikon Anda berukuran 192x192, SVG Font convention sering menggunakan 1000 atau 512.
    // Untuk penyederhanaan, kita gunakan 1000 sebagai horiz-adv-x.
    const UNITS_PER_EM = 192;
    const ASCENT = 192;
    const DESCENT = 0;

    // 1. Buat Header SVG Font XML
    const fontHeader = `
        <?xml version="1.0" standalone="no"?>
        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
        <defs>
        <font id="${fontName}" horiz-adv-x="${UNITS_PER_EM}">
            <font-face font-family="${fontName}" units-per-em="${UNITS_PER_EM}" ascent="${ASCENT}" descent="${DESCENT}" />
            <missing-glyph horiz-adv-x="${UNITS_PER_EM}" />
    `;

    // 2. Buat Glyph
    const glyphs = inputPaths.map(item => {
        const iconCharacter = item.catatan; 


        const sebelumDari = item.path.split(" ");
        const dari = sebelumDari.map(ini => {
            return ini.replace(",", "").replace("\n", "")
        });
        
        let indexNotNan = null

        const tinggi = parseInt(item.ukuran[1]);
        const hasilan = dari.map((ini, i) => {
            try {
                const angka = parseInt(ini);

                if(Number.isFinite(angka)){
                    const titikTengah = tinggi/2;
                    const rumus = titikTengah - (titikTengah - angka) * -1;
                    if(dari[indexNotNan] == "A"){
                        if(indexNotNan + 7 == i) {
                            return rumus;
                        } 
                        else if(indexNotNan + 5 == i) {
                            if(angka == 0){
                                return 1;
                            } else {
                                return 0;
                            }
                        } else {
                            return angka;
                        }
                    } else if(dari[parseInt(i)-1] == "H"){
                            return angka;
                    } else {
                        if(indexNotNan + 2 == i) {
                            return rumus;
                        } else if(indexNotNan + 1 == i) {
                            if(dari[parseInt(i)-1] == "V"){
                                return rumus;
                            } else {
                                return angka;
                            }
                        }
                    }
                } else {
                    indexNotNan = i;
                    return ini;
                }
            } catch(err){
                console.log(err);
            }
        }).join(" ");

        
        // MENGHITUNG NILAI UNICODE (misalnya 'S' -> 53 -> 35)
        const unicodeValue = iconCharacter.charCodeAt(0).toString(16).toUpperCase(); 
        
        // MENGGUNAKAN 'ukuran' HANYA UNTUK INFO, BUKAN UNTUK glyph HTML (horiz-adv-x tetap 1000)
        // Kita bisa mengabaikan item.ukuran jika horiz-adv-x selalu 1000.
        
        return `<glyph unicode="&#x${unicodeValue};" glyph-name="${iconCharacter.toLowerCase()}" d="${hasilan}" horiz-adv-x="${UNITS_PER_EM}" />`;
    }).join('');

    // 3. Buat Footer SVG Font XML
    const fontFooter = `
        </font>
        </defs>
        </svg>
    `;

    const svgFontContent = fontHeader + glyphs + fontFooter;

    // 4. Konversi SVG Font ke TTF
    const ttf = svg2ttf(svgFontContent, { 
        // PENTING: Pindahkan metadata (seperti version) ke dalam properti 'metadata'
        metadata: {
            version: '1.0.0', 
            ts: Math.round(Date.now() / 1000)
        }
    });

    // Kembalikan Buffer TTF
    return Buffer.from(ttf.buffer);
}

module.exports = {
    generateTtfFromSvgPaths,
};