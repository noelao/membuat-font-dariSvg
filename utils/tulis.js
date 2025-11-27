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

async function ambilPathBerapa(batas) {
    let berapa = batas == null ? 30 : batas;
    
    const { data, error } = await supabase
    .schema('svg')
    .from('path')
    .select('id, judul')
    .limit(berapa);

    if(error){
        return(error.message)
    };

    return data;
}

async function ambilJudulId(idToFind) {
  if (!idToFind) {
    console.error('Id article yang dicari tidak boleh kosong.');
    return null;
  }

  try {
    const { data, error } = await supabase
        .schema('svg')    
        .from('path')
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

async function updateKumpulanPath(dataFull, id) {
  try {
    const { data, error } = await supabase
      .schema('svg')
      .from('path')
      .update({
        kumpulan: dataFull
      })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    if (data.length === 0) {
    console.error('data tidak ditemukan ::', err);
    return null;
    }

    return data[0];

  } catch (err) {
    console.error('Kesalahan tak terduga saat mengambil article id ::', err);
    return null;
  }
}
async function buatCollomPathBaru(dataIni) {
    try{
        const { kumpulan } = dataIni;

        const { data, error } = await supabase
          .schema('svg')
          .from('path')
          .insert({ 
            kumpulan
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
async function buatRepoBaru(dataIni) {
    try{

        const { data, error } = await supabase
          .schema('svg')
          .from('path')
          .insert(dataIni)
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
  ambilJudulId,
  ambilPathBerapa,
  buatCollomPathBaru,
  updateKumpulanPath,
  buatRepoBaru
}