
//multer
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
var path = require("path");
var multer = require("multer");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const userId = "65c089fd1a3a9750d615fbf6";
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    const formattedToday = dd + "" + mm + "" + yyyy;
    cb(null, formattedToday + "-" + userId + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });

module.exports = { upload };
