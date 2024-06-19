const CryptoJS = require("crypto-js");

function generateUniqueId() {
  const randomBytes = CryptoJS.lib.WordArray.random(4);
  const id = randomBytes.toString(CryptoJS.enc.Hex).slice(0, 8);
  return id.toUpperCase();
}

function verifyUniqueId(code, existingCode) {
  console.log(code, existingCode, "match");
  return code === existingCode;
}

module.exports = { generateUniqueId, verifyUniqueId };
