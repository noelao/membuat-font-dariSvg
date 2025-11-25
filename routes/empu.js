const express = require('express');
const empuIni = express.Router();

empuIni.get("/", (req, res) => {
    const testApi = {
        tapi:"ini kan cuma test"
    }
    res.render("empu/empu", testApi);
})

module.exports = empuIni;