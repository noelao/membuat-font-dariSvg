// import supabase client
const { createClient } = require('@supabase/supabase-js');
// Konfigurasi Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Gunakan Service Key untuk operasi backend
if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Pastikan SUPABASE_URL dan SUPABASE_SERVICE_KEY sudah diatur di file .env Anda.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
// Konfigurasi Supabase

async function ambilCatatanBerapa(batas) {
    let berapa = batas == null ? 10 : batas;
    
    const { data, error } = await supabase
    .schema('svg')
    .from('tulisan')
    .select('*')
    .limit(berapa);

    if(error){
        return(error.message)
    };

    return data;
}

async function ambilCatatanId(idToFind) {
  if (!idToFind) {
    console.error('Id article yang dicari tidak boleh kosong.');
    return null;
  }

  try {
    const { data, error } = await supabase
        .schema('svg')    
        .from('tulisan')
        .select('*')
        .eq('id', idToFind);
    if (error) {
      console.error(`Error mengambil data article id : "${idToFind}" dari Supabase:`, error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data[0]; // Mengembalikan objek article id : pertama yang cocok
    } else {
      console.log(`article id : dengan id "${idToFind}" tidak ditemukan.`);
      return null;
    }
  } catch (err) {
    console.error('Kesalahan tak terduga saat mengambil article id ::', err);
    return null;
  }
}


async function buatTulisanBaru(dataIni) {
    try{
        const { judul, svg, empu } = dataIni;

        const { data, error } = await supabase
          .schema('svg')
          .from('tulisan')
          .insert({ 
            judul,
            svg,
            empu
          })
          .select()
          .single();
        
        if(error){
          return(error)
        }
        return(data)
    } catch(err){
        return(err.message)
    }
}


module.exports = {
    ambilCatatanId,
    ambilCatatanBerapa,
    buatTulisanBaru
}