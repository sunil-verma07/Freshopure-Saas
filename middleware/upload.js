const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new aws.S3();

const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_ITEM_IMAGE_BUCKET_NAME,
      acl: 'public-read',
      key: function (req, file, cb) {
        cb(null, Date.now().toString() + '-' + file.originalname);
      }
    })
  });

  
module.exports = {upload}