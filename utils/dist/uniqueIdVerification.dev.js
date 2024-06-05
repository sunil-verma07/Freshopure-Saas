"use strict";

var CryptoJS = require("crypto-js");

function generateUniqueId() {
  var randomBytes = CryptoJS.lib.WordArray.random(4);
  var id = randomBytes.toString(CryptoJS.enc.Hex).slice(0, 8);
  return id.toUpperCase();
}

module.exports = generateUniqueId;