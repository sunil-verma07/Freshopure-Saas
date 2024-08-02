const CryptoJS = require('crypto-js')

const secretKey = process.env.SECRET_KEY

const encrypt = text => {

    var encrypted = CryptoJS.AES.encrypt(text,secretKey);

    return encrypted.toString();
}

const decrypt = hash => {

  var bytes  = CryptoJS.AES.decrypt(hash, secretKey);
  var decrypted = bytes.toString(CryptoJS.enc.Utf8);

    return decrypted.toString();
}

module.exports = {
    encrypt,
    decrypt
}