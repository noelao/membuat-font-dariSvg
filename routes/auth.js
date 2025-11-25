const express = require('express');
const authIni = express.Router();



// import utils
const { 
  cobaLogin,
  prosesRegistrasi,
} = require("../utils/auth")
// import utils



authIni.get('/', (req, res) => {

  const forwardedIp = req.headers['x-forwarded-for'];
  const clientIp = forwardedIp ? forwardedIp.split(',')[0] : req.ip;

    console.log("nomor ip: ", clientIp);


    const kiriman = {
        id: req.params.id,
        layout: "layouts/main",
        title: "<{6\\6}>"
    }
    res.render("auth/auth", kiriman);
});

authIni.post('/login', async (req, res) => {
    
  const { name, password } = req.body;
  console.log('Menerima permintaan login untuk:', name);

  if (!name || !password) {
    // Jika validasi gagal, kirim JSON dan jangan redirect dari sini
    return res.status(400).json({ message: 'Nama (username) dan password diperlukan.' });
  }

  try {
    const loginResult = await cobaLogin({ name, password });
    if (loginResult.success && loginResult.token) {
      res.cookie('authToken', loginResult.token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict', 
        maxAge: 3600000 
      });
      console.log('Token disematkan di cookie, redirecting ke /admin');
      return res.redirect('/empu');
    } else {
      console.log('Login gagal:', loginResult.message);
      return res.redirect('/auth/login?error=authfailed');
    }
  } catch (error) {
    console.error('Error di rute /auth/login:', error);
    return res.redirect('/auth/login?error=servererror'); // Atau kirim respons JSON
  }
});
authIni.get('/logout', (req, res) => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  console.log('User logout, cookie authToken dihapus.');
  res.redirect('/auth/login?message=logoutsuccess');
});


authIni.post('/lahirkan', async (req, res) => {

  console.log(req.body);
  const { name, password } = req.body;
  console.log('Menerima permintaan login untuk:', name);

  if (!name || !password) {
    return res.status(400).json({ message: 'Nama (username) dan password diperlukan.' });
  }
  try {
    const regisTrasi = await prosesRegistrasi({name, password});
    console.log("berhasil membuat akun dengan username ", regisTrasi.name);
    console.log("mencoba login");
    try {
      const loginResult = await cobaLogin({ name, password });
      if (loginResult.success && loginResult.token) {
        res.cookie('authToken', loginResult.token, {
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'strict',
          maxAge: 3600000
        });
        console.log('Token disematkan di cookie, redirecting ke /admin');
        return res.redirect('/empu');
      } else {
        console.log('Login gagal:', loginResult.message);
        return res.redirect('/auth/login?error=authfailed');
      }
    } catch (error) {
      console.error('Error di rute /auth/login:', error);
      return res.redirect('/auth/login?error=servererror'); // Atau kirim respons JSON
    }
  } catch(err){
    console.log(err)
  }

});

module.exports = authIni;