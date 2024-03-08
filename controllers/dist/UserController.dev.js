"use strict";

var express = require("express");

require("dotenv").config();

var jwt = require("jsonwebtoken");

var msg91 = require("msg91")["default"];

var AWS = require("aws-sdk");

var fs = require("fs");

var ErrorHandler = require("../utils/errorhander.js");

var router = express.Router();

var User = require("../models/user.js");

var Role = require("../models/role.js");

var Address = require("../models/address.js");

var bcrypt = require("bcrypt");

var _require = require("../services/encryptionServices"),
    encrypt = _require.encrypt,
    decrypt = _require.decrypt;

var _require2 = require("../utils/sendEmailVerification.js"),
    sendEmailVerification = _require2.sendEmailVerification,
    checkVerification = _require2.checkVerification;

var sendToken = require("../utils/jwtToken.js");

var catchAsyncErrors = require("../middleware/catchAsyncErrors.js");

var _require3 = require("../middleware/auth.js"),
    isAuthenticatedUser = _require3.isAuthenticatedUser;

var register = catchAsyncErrors(function _callee(req, res, next) {
  var _req$body, _fullName, email, phone, password, role, user, hashedPassword, userRole, newUser;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, _fullName = _req$body.fullName, email = _req$body.email, phone = _req$body.phone, password = _req$body.password, role = _req$body.role;

          if (!(!_fullName || !email || !password || !phone || !role)) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: "Please enter all feilds properly!"
          }));

        case 6:
          _context.next = 8;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }).select("+password"));

        case 8:
          user = _context.sent;
          console.log(user);

          if (!user) {
            _context.next = 14;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            success: false,
            error: "User already exists!"
          }));

        case 14:
          hashedPassword = encrypt(password);
          _context.next = 17;
          return regeneratorRuntime.awrap(Role.findOne({
            name: role
          }));

        case 17:
          userRole = _context.sent;
          _context.next = 20;
          return regeneratorRuntime.awrap(User.create({
            email: email,
            phone: phone,
            password: hashedPassword,
            fullName: _fullName,
            roleId: userRole._id
          }));

        case 20:
          newUser = _context.sent;
          sendEmailVerification(email, function (error) {
            if (error) {
              return res.status(500).json({
                success: false,
                error: error
              });
            } else {
              res.status(200).json({
                user: newUser
              });
            }
          });

        case 22:
          _context.next = 27;
          break;

        case 24:
          _context.prev = 24;
          _context.t0 = _context["catch"](0);
          res.send(_context.t0);

        case 27:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 24]]);
});
var myProfile = catchAsyncErrors(function _callee2(req, res, next) {
  var userId, user;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          userId = req.user._id;
          _context2.next = 3;
          return regeneratorRuntime.awrap(User.findOne({
            _id: userId
          }).populate("roleId"));

        case 3:
          user = _context2.sent;

          if (user) {
            _context2.next = 8;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            success: false,
            error: "Unauthenticated User"
          }));

        case 8:
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            user: user
          }));

        case 9:
        case "end":
          return _context2.stop();
      }
    }
  });
});
var logout = catchAsyncErrors(function _callee3(req, res, next) {
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true
          });
          res.status(200).json({
            success: true,
            message: "Logged Out"
          });

        case 2:
        case "end":
          return _context3.stop();
      }
    }
  });
});
var emailVerification = catchAsyncErrors(function _callee4(req, res) {
  var _req$body2, email, code;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _req$body2 = req.body, email = _req$body2.email, code = _req$body2.code;
          _context4.next = 4;
          return regeneratorRuntime.awrap(checkVerification(email, code, function (error, status) {
            if (error) {
              sendEmailVerification(email, function (error2) {
                if (error2) {
                  res.status(400).json({
                    success: false,
                    error: error2
                  });
                } else {
                  res.status(500).json({
                    success: false,
                    error: error + ". Please enter the new code sent to your email."
                  });
                }
              });
            } else if (status) {
              res.status(200).json({
                success: true
              });
            }
          }));

        case 4:
          _context4.next = 9;
          break;

        case 6:
          _context4.prev = 6;
          _context4.t0 = _context4["catch"](0);
          res.status(400).json({
            success: false,
            error: _context4.t0
          });

        case 9:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 6]]);
});
var login = catchAsyncErrors(function _callee5(req, res, next) {
  var _req$body3, email, password, user, decryptPassword;

  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _req$body3 = req.body, email = _req$body3.email, password = _req$body3.password;
          console.log(email, password);

          if (!(!email || !password)) {
            _context5.next = 6;
            break;
          }

          return _context5.abrupt("return", res.status(400).json({
            success: false,
            error: "Please enter all fields properly!"
          }));

        case 6:
          _context5.next = 8;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }).populate("roleId"));

        case 8:
          user = _context5.sent;

          if (user) {
            _context5.next = 13;
            break;
          }

          return _context5.abrupt("return", res.status(401).json({
            success: false,
            error: "Invalid credentials"
          }));

        case 13:
          decryptPassword = decrypt(user.password);

          if (!(decryptPassword !== password)) {
            _context5.next = 18;
            break;
          }

          return _context5.abrupt("return", res.status(401).json({
            success: false,
            error: "Invalid credentials"
          }));

        case 18:
          return _context5.abrupt("return", sendToken(user, 200, res));

        case 19:
        case "end":
          return _context5.stop();
      }
    }
  });
});
var setProfile = catchAsyncErrors(function _callee6(req, res, next) {
  var UserId, _req$body4, hotelName, addressLine1, addressLine2, state, city, pinCode, update, profile, address;

  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          UserId = req.user._id;
          _req$body4 = req.body, hotelName = _req$body4.hotelName, addressLine1 = _req$body4.addressLine1, addressLine2 = _req$body4.addressLine2, state = _req$body4.state, city = _req$body4.city, pinCode = _req$body4.pinCode, update = _req$body4.update;

          if (!update) {
            _context6.next = 9;
            break;
          }

          _context6.next = 6;
          return regeneratorRuntime.awrap(User.updateOne({
            UserId: new ObjectId(UserId)
          }, {
            $set: {
              fullName: fullName,
              hotelName: hotelName
            }
          }));

        case 6:
          res.status(200).json({
            message: "User Profile Updated"
          });
          _context6.next = 20;
          break;

        case 9:
          profile = new User({
            UserId: UserId,
            hotelName: hotelName
          });
          _context6.next = 12;
          return regeneratorRuntime.awrap(profile.save());

        case 12:
          _context6.next = 14;
          return regeneratorRuntime.awrap(Address.updateMany({
            UserId: new ObjectId(UserId),
            selected: true
          }, {
            $set: {
              selected: false
            }
          }));

        case 14:
          address = new Address({
            UserId: UserId,
            hotelName: hotelName,
            addressLine1: addressLine1,
            addressLine2: addressLine2,
            state: state,
            city: city,
            pinCode: pinCode
          });
          _context6.next = 17;
          return regeneratorRuntime.awrap(address.save());

        case 17:
          _context6.next = 19;
          return regeneratorRuntime.awrap(User.updateOne({
            _id: new ObjectId(UserId)
          }, {
            $set: {
              isProfieComplete: true
            }
          }));

        case 19:
          res.status(200).json({
            message: "User Profile Updated"
          });

        case 20:
          _context6.next = 25;
          break;

        case 22:
          _context6.prev = 22;
          _context6.t0 = _context6["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 25:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 22]]);
});
var setProfileImage = catchAsyncErrors(function _callee7(req, res, next) {
  var UserId, filePath, fileName, update, bucketName, region, accessKeyId, secretAccessKey, s3, uploadParams, s3UploadResponse, s3FileUrl, userImage, present, profileImage;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          UserId = req.user._id;
          filePath = req.files[0].path;
          fileName = req.files[0].filename;
          update = req.body.update;
          bucketName = process.env.AWS_USER_IMAGE_BUCKET_NAME;
          region = process.env.AWS_BUCKET_REGION;
          accessKeyId = process.env.AWS_ACCESS_KEY;
          secretAccessKey = process.env.AWS_SECRET_KET;
          AWS.config.update({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            region: region
          });
          s3 = new AWS.S3();
          uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: fs.createReadStream(filePath)
          };
          _context7.next = 14;
          return regeneratorRuntime.awrap(s3.upload(uploadParams).promise());

        case 14:
          s3UploadResponse = _context7.sent;
          // Now you can save the S3 file URL and other details to your database
          s3FileUrl = s3UploadResponse.Location;
          userImage = s3FileUrl;
          _context7.next = 19;
          return regeneratorRuntime.awrap(User.findOne({
            UserId: new ObjectId(UserId)
          }));

        case 19:
          present = _context7.sent;

          if (!(update && present)) {
            _context7.next = 25;
            break;
          }

          _context7.next = 23;
          return regeneratorRuntime.awrap(User.updateOne({
            UserId: new ObjectId(UserId)
          }, {
            $set: {
              userImage: userImage
            }
          }));

        case 23:
          _context7.next = 28;
          break;

        case 25:
          profileImage = new User({
            UserId: UserId,
            userImage: userImage
          });
          _context7.next = 28;
          return regeneratorRuntime.awrap(profileImage.save());

        case 28:
          // Remove the temporary file from the server
          fs.unlinkSync(filePath); // Respond to the client

          res.status(200).json({
            message: "File uploaded and saved successfully"
          });
          _context7.next = 35;
          break;

        case 32:
          _context7.prev = 32;
          _context7.t0 = _context7["catch"](0);
          res.status(200).json({
            error: "Internal server error"
          });

        case 35:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 32]]);
});
module.exports = {
  login: login,
  register: register,
  emailVerification: emailVerification,
  myProfile: myProfile,
  logout: logout,
  setProfile: setProfile,
  setProfileImage: setProfileImage
};