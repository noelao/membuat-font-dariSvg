const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET tidak diatur di file .env.");
  process.exit(1);
}

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

async function hashPassword(passwordAsli) {
  try {
    const hashedPassword = await bcrypt.hash(passwordAsli, saltRounds);
    console.log('Password Asli:', passwordAsli);
    console.log('Password Hash:', hashedPassword);

    return hashedPassword;
  } catch (error) {
    console.error('Error saat hashing password:', error);
    throw error;
  }
}

async function prosesRegistrasi({ name, password }) {

  console.log(`Mencoba registrasi untuk user: ${name}`);

  try {
    const hashUntukDisimpan = await hashPassword(password);
    const { data, error } = await supabase
      .schema('tertulis')
      .from('empu')
      .insert([{ asma: name, stempel: hashUntukDisimpan }])
      .select();

    if (error) {
      console.error('Error Supabase saat registrasi:', error.message);
      throw error;
    }
    console.log(`Untuk user ${name}, data tersimpan:`, data);
    return data[0];
  } catch (err) {
    console.error('Registrasi gagal:', err.message);
    throw err;
  }
}

async function verifikasiPassword(passwordYangDimasukkan, hashedPasswordDariDB) {
  console.log( passwordYangDimasukkan, hashedPasswordDariDB )
  try {
    const cocok = await bcrypt.compare(passwordYangDimasukkan, hashedPasswordDariDB);
    if (cocok) {
      console.log('Password cocok! Login berhasil.');
      return true;
    } else {
      console.log('Password tidak cocok! Login gagal.');
      return false;
    }
  } catch (error) {
    console.error('Error saat verifikasi password:', error);
    throw error; // atau tangani error
  }
}

async function getUserByUsernameSupabase(usernameToFind) {
  if (!usernameToFind) {
    console.error('Username yang dicari tidak boleh kosong.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .schema('tertulis')
      .from('empu')
      .select('id, asma, tugas, stempel') // Pilih semua kolom, atau sebutkan kolom spesifik: 'id, username, email' hapus stempel bila tidak ingin mengambil "stempel"
      .eq('asma', usernameToFind); // Filter: kolom 'username' sama dengan usernameToFind

    if (error) {
      console.error(`Error mengambil data pengguna "${usernameToFind}" dari Supabase:`, error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data[0]; // Mengembalikan objek pengguna pertama yang cocok
    } else {
      console.log(`Pengguna dengan username "${usernameToFind}" tidak ditemukan.`);
      return null;
    }
  } catch (err) {
    console.error('Kesalahan tak terduga saat mengambil pengguna:', err);
    return null;
  }
}
async function getUserByIdSupabase(idToFind) {
  if (!idToFind) {
    console.error('Id yang dicari tidak boleh kosong.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .schema('tertulis')
      .from('empu')
      .select('*')
      .eq('id', idToFind);

    if (error) {
      console.error(`Error mengambil data pengguna "${idToFind}" dari Supabase:`, error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data[0]; // Mengembalikan objek pengguna pertama yang cocok
    } else {
      console.log(`Pengguna dengan username "${idToFind}" tidak ditemukan.`);
      return null;
    }
  } catch (err) {
    console.error('Kesalahan tak terduga saat mengambil pengguna:', err);
    return null;
  }
}


async function cobaLogin(credentials) {
  const { name: username, password } = credentials;
  console.log(`Mencoba login untuk user: ${username}`);

  const userFromDb = await getUserByUsernameSupabase(username, supabase);
  console.log("User dari DB saat login:", userFromDb);

  if (userFromDb && userFromDb.stempel) {
    const passwordValid = await verifikasiPassword(password, userFromDb.stempel);

    if (passwordValid) {
      const payload = {
        userId: userFromDb.id,
        username: userFromDb.asma,
        tugas: userFromDb.tugas
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '100y' }); // '1h' = 1 jam

      console.log(`Login berhasil untuk user: ${username}. Token dibuat.`);
      return {
        success: true,
        message: `Login berhasil untuk ${username}`,
        token: token,
        user: {
          id: userFromDb.id,
          username: userFromDb.asma,
          tugas: userFromDb.tugas
        }
      };
    } else {
      console.log(`Login gagal untuk user: ${username}. Password tidak valid.`);
      return { success: false, message: 'Username atau password salah.' };
    }
  } else {
    console.log(`Login gagal. User ${username} tidak ditemukan atau tidak memiliki hash password.`);
    return { success: false, message: 'Username atau password salah.' };
  }
}


function verifyToken(req, res, next) {
  const token = req.cookies.authToken;

  if (token == null) {
    console.log('Akses ditolak: Token tidak ditemukan di cookie.');
    return res.redirect('/auth/login?error=noauth');
  }

  jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
    if (err) {
      console.error('Verifikasi token gagal:', err.message);
      res.clearCookie('authToken');
      if (err.name === 'TokenExpiredError') {
        return res.redirect('/auth/login?error=expired');
      }
      return res.redirect('/auth/login?error=invalidtoken');
    }

    req.user = decodedPayload;
    console.log('Token berhasil diverifikasi dari cookie. User:', req.user);
    next();
  });
}

function authSession(req, res, next){
  const token = req.cookies.authToken;

  if (token == null) {
    req.user = null
    next();
  } else {
    jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
      if (err) {
        console.error('Verifikasi token gagal:', err.message);
        res.clearCookie('authToken');
        if (err.name === 'TokenExpiredError') {
          return res.redirect('/login?error=expired');
        }
        return res.redirect('/login?error=invalidtoken');
      }
  
      req.user = decodedPayload;
      next();
    });
  }
}

function authorizeAdmin(req, res, next) {
  if (req.user && req.user.tugas === 'ADMIN') {
    next();
  } else {
    console.log(`Otorisasi admin gagal. User: ${req.user ? req.user.username : 'Tidak ada'}, Peran: ${req.user ? req.user.role : 'Tidak ada'}`);
    res.redirect('empu')
  }
}


module.exports = {
   getUserByUsernameSupabase, 
   cobaLogin, 
   prosesRegistrasi,
   verifyToken,
   authorizeAdmin,
   authSession,
   getUserByIdSupabase
  }