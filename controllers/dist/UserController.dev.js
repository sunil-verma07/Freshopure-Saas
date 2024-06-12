"use strict";

var express = require("express");

require("dotenv").config();

var itemImageS3 = require("../services/itemImageS3.js");

var AWS = require("aws-sdk");

var fs = require("fs");

var _require = require("mongodb"),
    ObjectId = _require.ObjectId;

var ErrorHandler = require("../utils/errorhander.js");

var router = express.Router();

var util = require("util");

var unlinkFile = util.promisify(fs.unlink);

var User = require("../models/user.js");

var Role = require("../models/role.js");

var Address = require("../models/address.js");

var _require2 = require("../services/encryptionServices"),
    encrypt = _require2.encrypt,
    decrypt = _require2.decrypt;

var _require3 = require("../utils/sendEmailVerification.js"),
    sendEmailVerification = _require3.sendEmailVerification,
    checkVerification = _require3.checkVerification,
    sendMail = _require3.sendMail,
    resendOtp = _require3.resendOtp;

var _require4 = require("../utils/jwtToken.js"),
    sendToken = _require4.sendToken;

var catchAsyncErrors = require("../middleware/catchAsyncErrors.js");

var _require5 = require("../middleware/auth.js"),
    isAuthenticatedUser = _require5.isAuthenticatedUser;

var userDetails = require("../models/userDetails.js");

var _require6 = require("../utils/sendEmailVerification.js"),
    sendOtp = _require6.sendOtp,
    verifyOtp = _require6.verifyOtp;

var _require7 = require("../services/uniqueIdVerification.js"),
    generateUniqueId = _require7.generateUniqueId,
    verifyUniqueId = _require7.verifyUniqueId;

var myProfile = catchAsyncErrors(function _callee(req, res, next) {
  var userId, user;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          userId = req.user._id;
          _context.next = 3;
          return regeneratorRuntime.awrap(User.aggregate([{
            $match: {
              _id: userId
            }
          }, {
            $lookup: {
              from: "UserDetails",
              localField: "_id",
              foreignField: "userId",
              as: "imageDetails"
            }
          }, {
            $unwind: "$imageDetails"
          }]));

        case 3:
          user = _context.sent;

          if (user) {
            _context.next = 8;
            break;
          }

          return _context.abrupt("return", res.status(401).json({
            success: false,
            error: "Unauthenticated User"
          }));

        case 8:
          return _context.abrupt("return", res.status(200).json({
            user: user[0]
          }));

        case 9:
        case "end":
          return _context.stop();
      }
    }
  });
});
var logout = catchAsyncErrors(function _callee2(req, res, next) {
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
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
          return _context2.stop();
      }
    }
  });
});
var emailVerification = catchAsyncErrors(function _callee3(req, res) {
  var _req$body, phone, code, _ref, message, user, roleId, newUser;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _req$body = req.body, phone = _req$body.phone, code = _req$body.code; // console.log(phone, code);

          _context3.next = 4;
          return regeneratorRuntime.awrap(verifyOtp(phone, code));

        case 4:
          _ref = _context3.sent;
          message = _ref.message;

          if (!(message !== "OTP verified success")) {
            _context3.next = 10;
            break;
          }

          return _context3.abrupt("return", res.json({
            success: false,
            message: message
          }));

        case 10:
          _context3.next = 12;
          return regeneratorRuntime.awrap(User.findOne({
            phone: phone
          }));

        case 12:
          user = _context3.sent;

          if (!user) {
            _context3.next = 24;
            break;
          }

          if (!(!user.isProfileComplete && !user.isReviewed && !user.isApproved)) {
            _context3.next = 18;
            break;
          }

          return _context3.abrupt("return", res.status(200).json({
            success: true,
            user: user
          }));

        case 18:
          _context3.next = 20;
          return regeneratorRuntime.awrap(Role.findOne({
            _id: user.roleId
          }));

        case 20:
          roleId = _context3.sent;
          return _context3.abrupt("return", sendToken(user, 200, res, roleId.name));

        case 22:
          _context3.next = 28;
          break;

        case 24:
          _context3.next = 26;
          return regeneratorRuntime.awrap(User.create({
            phone: phone
          }));

        case 26:
          newUser = _context3.sent;
          // console.log(newUser, "newUser");
          res.status(200).json({
            success: true,
            user: newUser
          });

        case 28:
          _context3.next = 34;
          break;

        case 30:
          _context3.prev = 30;
          _context3.t0 = _context3["catch"](0);
          console.log(_context3.t0);
          res.status(400).json({
            success: false,
            error: _context3.t0
          });

        case 34:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 30]]);
});
var login = catchAsyncErrors(function _callee4(req, res, next) {
  var _req$body2, phone, code, user, existingCode, isUser, roleId;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          // console.log(req.body, "body");
          _req$body2 = req.body, phone = _req$body2.phone, code = _req$body2.code;

          if (phone) {
            _context4.next = 6;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            success: false,
            error: "Please enter your phone number!"
          }));

        case 6:
          if (code) {
            _context4.next = 11;
            break;
          }

          _context4.next = 9;
          return regeneratorRuntime.awrap(sendOtp(phone));

        case 9:
          _context4.next = 34;
          break;

        case 11:
          if (!(code.length === 8)) {
            _context4.next = 33;
            break;
          }

          _context4.next = 14;
          return regeneratorRuntime.awrap(User.findOne({
            phone: phone
          }));

        case 14:
          user = _context4.sent;

          if (user) {
            _context4.next = 17;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            success: false,
            error: "User not found!"
          }));

        case 17:
          _context4.next = 19;
          return regeneratorRuntime.awrap(decrypt(user.uniqueId));

        case 19:
          existingCode = _context4.sent;
          _context4.next = 22;
          return regeneratorRuntime.awrap(verifyUniqueId(code, existingCode));

        case 22:
          isUser = _context4.sent;
          _context4.next = 25;
          return regeneratorRuntime.awrap(Role.findOne({
            _id: user.roleId
          }));

        case 25:
          roleId = _context4.sent;

          if (!isUser) {
            _context4.next = 30;
            break;
          }

          return _context4.abrupt("return", sendToken(user, 200, res, roleId.name));

        case 30:
          return _context4.abrupt("return", res.json({
            success: false,
            message: "Incorrect UniqueId!"
          }));

        case 31:
          _context4.next = 34;
          break;

        case 33:
          return _context4.abrupt("return", res.json({
            success: false,
            error: "Please Recheck your code!"
          }));

        case 34:
          return _context4.abrupt("return", res.status(200).json({
            message: "OTP sent",
            otp: true
          }));

        case 35:
          _context4.next = 41;
          break;

        case 37:
          _context4.prev = 37;
          _context4.t0 = _context4["catch"](0);
          console.log(_context4.t0, "err");
          return _context4.abrupt("return", res.status(401).json({
            message: "Failed to send OTP"
          }));

        case 41:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 37]]);
});
var resend = catchAsyncErrors(function _callee5(req, res, next) {
  var phone;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          phone = req.body.phone; // console.log(phone);

          if (phone) {
            _context5.next = 6;
            break;
          }

          return _context5.abrupt("return", res.status(400).json({
            success: false,
            error: "Please enter your phone number!"
          }));

        case 6:
          _context5.next = 8;
          return regeneratorRuntime.awrap(resendOtp(phone));

        case 8:
          return _context5.abrupt("return", res.status(200).json({
            message: "OTP sent"
          }));

        case 11:
          _context5.prev = 11;
          _context5.t0 = _context5["catch"](0);
          console.log(_context5.t0, "err");
          return _context5.abrupt("return", res.status(401).json({
            message: "Failed to send OTP"
          }));

        case 15:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 11]]);
});
var setProfile = catchAsyncErrors(function _callee6(req, res, next) {
  var UserId, _req$body3, hotelName, addressLine1, addressLine2, state, city, pinCode, update, profile, address;

  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          UserId = req.user._id;
          _req$body3 = req.body, hotelName = _req$body3.hotelName, addressLine1 = _req$body3.addressLine1, addressLine2 = _req$body3.addressLine2, state = _req$body3.state, city = _req$body3.city, pinCode = _req$body3.pinCode, update = _req$body3.update;

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
var profileComplete = catchAsyncErrors(function _callee7(req, res, next) {
  var _req$body4, _fullName, organization, role, email, phone, code, encryptedCode, roleId, user, updatedUser;

  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          _req$body4 = req.body, _fullName = _req$body4.fullName, organization = _req$body4.organization, role = _req$body4.role, email = _req$body4.email, phone = _req$body4.phone;

          if (!(!_fullName || !organization || !role || !email || !phone)) {
            _context7.next = 6;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            success: false,
            error: "Please enter all fields properly!"
          }));

        case 6:
          _context7.next = 8;
          return regeneratorRuntime.awrap(generateUniqueId());

        case 8:
          code = _context7.sent;
          _context7.next = 11;
          return regeneratorRuntime.awrap(encrypt(code));

        case 11:
          encryptedCode = _context7.sent;
          _context7.next = 14;
          return regeneratorRuntime.awrap(Role.findOne({
            name: role
          }));

        case 14:
          roleId = _context7.sent;
          _context7.next = 17;
          return regeneratorRuntime.awrap(User.findOne({
            phone: phone
          }));

        case 17:
          user = _context7.sent;

          if (!user) {
            _context7.next = 35;
            break;
          }

          user.uniqueId = encryptedCode;
          user.fullName = _fullName;
          user.organization = organization;
          user.roleId = roleId._id;
          user.email = email;
          user.isProfileComplete = true;
          user.isApproved = true;
          user.isReviewed = true;
          _context7.next = 29;
          return regeneratorRuntime.awrap(user.save());

        case 29:
          _context7.next = 31;
          return regeneratorRuntime.awrap(User.findOne({
            phone: phone
          }));

        case 31:
          updatedUser = _context7.sent;
          return _context7.abrupt("return", sendToken(updatedUser, 200, res, role));

        case 35:
          console.log("errr");
          return _context7.abrupt("return", res.status(400).json({
            success: false,
            error: "Can't Update User Details!"
          }));

        case 37:
          _context7.next = 43;
          break;

        case 39:
          _context7.prev = 39;
          _context7.t0 = _context7["catch"](0);
          console.error(_context7.t0);
          return _context7.abrupt("return", res.status(400).json({
            message: "Internal Server Error"
          }));

        case 43:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 39]]);
});
var setProfileImage = catchAsyncErrors(function _callee8(req, res, next) {
  var userId, images, imagesReqBody, i, image, result, imageReqBody, user;
  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          // console.log(req, "req");
          userId = req.user._id;
          images = req.files; // console.log(images, "img");

          if (images) {
            _context8.next = 5;
            break;
          }

          return _context8.abrupt("return", res.json({
            message: "Please Select an Image"
          }));

        case 5:
          imagesReqBody = [];
          i = 0;

        case 7:
          if (!(i < images.length)) {
            _context8.next = 20;
            break;
          }

          image = images[i];
          _context8.next = 11;
          return regeneratorRuntime.awrap(itemImageS3.uploadFile(image));

        case 11:
          result = _context8.sent;
          _context8.next = 14;
          return regeneratorRuntime.awrap(unlinkFile(image.path));

        case 14:
          if (image.fieldname == "image") isDisplayImage = true;
          imageReqBody = {
            imageLink: "/items/image/".concat(result.Key)
          }; // console.log(imageReqBody,result);

          imagesReqBody.push(imageReqBody);

        case 17:
          ++i;
          _context8.next = 7;
          break;

        case 20:
          _context8.next = 22;
          return regeneratorRuntime.awrap(userDetails.findOne({
            userId: userId
          }));

        case 22:
          user = _context8.sent;

          if (user) {
            user.img = imagesReqBody[0].imageLink;
          } else {
            user = userDetails.create({
              userId: userId,
              img: imagesReqBody[0].imageLink
            });
          }

          _context8.next = 26;
          return regeneratorRuntime.awrap(user.save());

        case 26:
          // Respond to the client
          res.status(201).json({
            message: "File uploaded and saved successfully",
            user: user
          });
          _context8.next = 33;
          break;

        case 29:
          _context8.prev = 29;
          _context8.t0 = _context8["catch"](0);
          console.log(_context8.t0, "err");
          res.status(200).json({
            error: "Internal server error"
          });

        case 33:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 29]]);
});
var userDetailUpdate = catchAsyncErrors(function _callee9(req, res, next) {
  var _req$body5, _fullName2, organization, phone, email, userId, user;

  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _req$body5 = req.body, _fullName2 = _req$body5.fullName, organization = _req$body5.organization, phone = _req$body5.phone, email = _req$body5.email;
          userId = req.user._id;

          if (!(!_fullName2 || !organization || !phone || !email)) {
            _context9.next = 7;
            break;
          }

          return _context9.abrupt("return", res.status(400).json({
            success: false,
            error: "Please enter all fields properly!"
          }));

        case 7:
          _context9.next = 9;
          return regeneratorRuntime.awrap(User.findOne({
            _id: userId
          }));

        case 9:
          user = _context9.sent;

          if (!user) {
            _context9.next = 20;
            break;
          }

          user.fullName = _fullName2;
          user.organization = organization;
          user.phone = phone;
          user.email = email;
          _context9.next = 17;
          return regeneratorRuntime.awrap(user.save());

        case 17:
          return _context9.abrupt("return", res.json({
            message: "User Details Updated",
            user: user
          }));

        case 20:
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            error: "Can't Update User Details!"
          }));

        case 21:
          _context9.next = 26;
          break;

        case 23:
          _context9.prev = 23;
          _context9.t0 = _context9["catch"](0);
          return _context9.abrupt("return", res.status(400).json({
            message: "Internal Server Error"
          }));

        case 26:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 23]]);
}); // const addUserDetails = catchAsyncErrors(async function (req, res, next) {
//   const userId = req.user._id;
//   const images = req.files;
//   console.log(images, "img");
//   try {
//     if (!images) {
//       return res.json({ message: "Please Select an Image" });
//     }
//     let imagesReqBody = [];
//     for (let i = 0; i < images.length; ++i) {
//       const image = images[i];
//       const result = await itemImageS3.uploadFile(image);
//       // console.log(result)
//       await unlinkFile(image.path);
//       if (image.fieldname == "image") isDisplayImage = true;
//       const imageReqBody = {
//         imageLink: `/items/image/${result.Key}`,
//       };
//       // console.log(imageReqBody,result);
//       imagesReqBody.push(imageReqBody);
//     }
//     let user = await userDetails.findOne({ userId: userId });
//     if (user) {
//       user.img = imagesReqBody[0].imageLink;
//     } else {
//       user = userDetails.create({
//         userId: userId,
//         img: imagesReqBody[0].imageLink,
//       });
//     }
//     await user.save();
//     res
//       .status(201)
//       .json({ message: "User Details Updated successfully", user: user });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

var addUserDetails = catchAsyncErrors(function _callee10(req, res, next) {
  var userId, image, result, user;
  return regeneratorRuntime.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          userId = req.user._id;
          image = req.file; // Changed to req.file to handle only one image
          // console.log(image, "img");

          _context10.prev = 2;

          if (image) {
            _context10.next = 5;
            break;
          }

          return _context10.abrupt("return", res.json({
            message: "Please Select an Image"
          }));

        case 5:
          _context10.next = 7;
          return regeneratorRuntime.awrap(itemImageS3.uploadFile(image));

        case 7:
          result = _context10.sent;
          _context10.next = 10;
          return regeneratorRuntime.awrap(unlinkFile(image.path));

        case 10:
          _context10.next = 12;
          return regeneratorRuntime.awrap(userDetails.findOne({
            userId: userId
          }));

        case 12:
          user = _context10.sent;

          if (user) {
            user.img = "/items/image/".concat(result.Key);
          } else {
            user = userDetails.create({
              userId: userId,
              img: "/items/image/".concat(result.Key)
            });
          }

          _context10.next = 16;
          return regeneratorRuntime.awrap(user.save());

        case 16:
          res.status(201).json({
            message: "User Details Updated successfully",
            user: user
          });
          _context10.next = 23;
          break;

        case 19:
          _context10.prev = 19;
          _context10.t0 = _context10["catch"](2);
          console.error(_context10.t0);
          res.status(500).json({
            message: "Internal server error"
          });

        case 23:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[2, 19]]);
});
module.exports = {
  login: login,
  emailVerification: emailVerification,
  myProfile: myProfile,
  logout: logout,
  resend: resend,
  setProfile: setProfile,
  setProfileImage: setProfileImage,
  userDetailUpdate: userDetailUpdate,
  addUserDetails: addUserDetails,
  profileComplete: profileComplete
};