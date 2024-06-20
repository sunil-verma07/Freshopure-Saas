"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

var UserDetails = require("../models/userDetails.js");

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

var _require6 = require("../utils/sendEmailVerification.js"),
    sendOtp = _require6.sendOtp,
    verifyOtp = _require6.verifyOtp;

var _require7 = require("../services/uniqueIdVerification.js"),
    generateUniqueId = _require7.generateUniqueId,
    verifyUniqueId = _require7.verifyUniqueId;

var userDetails = require("../models/userDetails.js");

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
  var _req$body, phone, code, uniqueCode, encryptedCode, _ref, message, user, newUser, _userDetails, resUser, userDetail, roleId, result;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _req$body = req.body, phone = _req$body.phone, code = _req$body.code;
          _context3.next = 4;
          return regeneratorRuntime.awrap(generateUniqueId());

        case 4:
          uniqueCode = _context3.sent;
          _context3.next = 7;
          return regeneratorRuntime.awrap(encrypt(uniqueCode));

        case 7:
          encryptedCode = _context3.sent;
          _context3.next = 10;
          return regeneratorRuntime.awrap(verifyOtp(phone, code));

        case 10:
          _ref = _context3.sent;
          message = _ref.message;

          if (!(message !== "OTP verified success")) {
            _context3.next = 16;
            break;
          }

          return _context3.abrupt("return", res.json({
            success: false,
            message: message
          }));

        case 16:
          _context3.next = 18;
          return regeneratorRuntime.awrap(User.findOne({
            phone: phone
          }));

        case 18:
          user = _context3.sent;

          if (user) {
            _context3.next = 30;
            break;
          }

          _context3.next = 22;
          return regeneratorRuntime.awrap(User.create({
            uniqueId: encryptedCode,
            phone: phone,
            isProfileComplete: false,
            isReviewed: false,
            isApproved: false,
            hasActiveSubscription: true,
            dateOfActivation: null
          }));

        case 22:
          newUser = _context3.sent;
          _context3.next = 25;
          return regeneratorRuntime.awrap(UserDetails.findOne({
            userId: newUser._id
          }));

        case 25:
          _userDetails = _context3.sent;
          resUser = _objectSpread({}, newUser, {}, _userDetails);
          res.status(200).json({
            success: true,
            user: resUser
          });
          _context3.next = 44;
          break;

        case 30:
          if (!(!user.isProfileComplete && !user.isReviewed && !user.isApproved)) {
            _context3.next = 34;
            break;
          }

          return _context3.abrupt("return", res.status(200).json({
            success: true,
            user: user
          }));

        case 34:
          _context3.next = 36;
          return regeneratorRuntime.awrap(UserDetails.findOne({
            userId: user._id
          }));

        case 36:
          userDetail = _context3.sent;
          _context3.next = 39;
          return regeneratorRuntime.awrap(Role.findOne({
            _id: userDetail.roleId
          }));

        case 39:
          roleId = _context3.sent;
          _context3.next = 42;
          return regeneratorRuntime.awrap(User.aggregate([{
            $match: {
              _id: user._id
            }
          }, {
            $lookup: {
              from: "UserDetails",
              // Name of the UserDetails collection
              localField: "_id",
              foreignField: "userId",
              as: "userDetails"
            }
          }, {
            $unwind: {
              path: "$userDetails",
              preserveNullAndEmptyArrays: true
            }
          }, // Unwind the userDetails array
          {
            $addFields: {
              fullName: "$userDetails.fullName",
              email: "$userDetails.email",
              roleId: "$userDetails.roleId",
              organization: "$userDetails.organization"
            }
          }, {
            $project: {
              userDetails: 0
            }
          }]).exec());

        case 42:
          result = _context3.sent;
          return _context3.abrupt("return", sendToken(result[0], 200, res, roleId.name));

        case 44:
          _context3.next = 50;
          break;

        case 46:
          _context3.prev = 46;
          _context3.t0 = _context3["catch"](0);
          console.log(_context3.t0);
          res.status(400).json({
            success: false,
            error: _context3.t0
          });

        case 50:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 46]]);
});
var login = catchAsyncErrors(function _callee4(req, res, next) {
  var _req$body2, phone, code, userId, user, existingCode, isUser, roleId, result;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
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
          _context4.next = 40;
          break;

        case 11:
          if (!(code.length === 8)) {
            _context4.next = 39;
            break;
          }

          _context4.next = 14;
          return regeneratorRuntime.awrap(User.findOne({
            phone: phone
          }));

        case 14:
          userId = _context4.sent;
          _context4.next = 17;
          return regeneratorRuntime.awrap(UserDetails.findOne({
            userId: userId._id
          }));

        case 17:
          user = _context4.sent;

          if (userId) {
            _context4.next = 20;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            success: false,
            error: "User not found!"
          }));

        case 20:
          _context4.next = 22;
          return regeneratorRuntime.awrap(decrypt(userId.uniqueId));

        case 22:
          existingCode = _context4.sent;
          _context4.next = 25;
          return regeneratorRuntime.awrap(verifyUniqueId(code, existingCode));

        case 25:
          isUser = _context4.sent;
          _context4.next = 28;
          return regeneratorRuntime.awrap(Role.findOne({
            _id: user.roleId
          }));

        case 28:
          roleId = _context4.sent;

          if (!isUser) {
            _context4.next = 36;
            break;
          }

          _context4.next = 32;
          return regeneratorRuntime.awrap(User.aggregate([{
            $match: {
              _id: userId._id
            }
          }, {
            $lookup: {
              from: "UserDetails",
              // Name of the UserDetails collection
              localField: "_id",
              foreignField: "userId",
              as: "userDetails"
            }
          }, {
            $unwind: {
              path: "$userDetails",
              preserveNullAndEmptyArrays: true
            }
          }, // Unwind the userDetails array
          {
            $addFields: {
              fullName: "$userDetails.fullName",
              email: "$userDetails.email",
              roleId: "$userDetails.roleId",
              organization: "$userDetails.organization"
            }
          }, {
            $project: {
              userDetails: 0
            }
          }]).exec());

        case 32:
          result = _context4.sent;
          return _context4.abrupt("return", sendToken(result[0], 200, res, roleId.name));

        case 36:
          return _context4.abrupt("return", res.json({
            success: false,
            message: "Incorrect UniqueId!"
          }));

        case 37:
          _context4.next = 40;
          break;

        case 39:
          return _context4.abrupt("return", res.json({
            success: false,
            error: "Please Recheck your code!"
          }));

        case 40:
          return _context4.abrupt("return", res.status(200).json({
            message: "OTP sent",
            otp: true
          }));

        case 41:
          _context4.next = 47;
          break;

        case 43:
          _context4.prev = 43;
          _context4.t0 = _context4["catch"](0);
          console.log(_context4.t0, "err");
          return _context4.abrupt("return", res.status(401).json({
            message: "Failed to send OTP"
          }));

        case 47:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 43]]);
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
var profileComplete = catchAsyncErrors(function _callee6(req, res, next) {
  var _req$body3, fullName, organization, role, email, phone, gst, fssai, roleId, user, _userDetails2, newProfile, result;

  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _req$body3 = req.body, fullName = _req$body3.fullName, organization = _req$body3.organization, role = _req$body3.role, email = _req$body3.email, phone = _req$body3.phone, gst = _req$body3.gst, fssai = _req$body3.fssai;

          if (!(!fullName || !organization || !role || !email || !phone || !gst || !fssai)) {
            _context6.next = 6;
            break;
          }

          return _context6.abrupt("return", res.status(400).json({
            success: false,
            error: "Please enter all fields properly!"
          }));

        case 6:
          _context6.next = 8;
          return regeneratorRuntime.awrap(Role.findOne({
            name: role
          }));

        case 8:
          roleId = _context6.sent;
          _context6.next = 11;
          return regeneratorRuntime.awrap(User.findOne({
            phone: phone
          }));

        case 11:
          user = _context6.sent;
          _context6.next = 14;
          return regeneratorRuntime.awrap(UserDetails.findOne({
            userId: user._id
          }));

        case 14:
          _userDetails2 = _context6.sent;

          if (!_userDetails2) {
            _context6.next = 19;
            break;
          }

          return _context6.abrupt("return", res.status(400).json({
            success: false,
            error: "Profile Already Completed"
          }));

        case 19:
          newProfile = new UserDetails({
            userId: user._id,
            fullName: fullName,
            email: email,
            organization: organization,
            roleId: roleId,
            GSTnumber: gst,
            FSSAInumber: fssai
          });
          _context6.next = 22;
          return regeneratorRuntime.awrap(newProfile.save());

        case 22:
          _context6.next = 24;
          return regeneratorRuntime.awrap(User.findOneAndUpdate({
            phone: phone
          }, {
            isProfileComplete: true,
            isReviewed: true,
            isApproved: true
          }));

        case 24:
          _context6.next = 26;
          return regeneratorRuntime.awrap(User.aggregate([{
            $match: {
              _id: user._id
            }
          }, {
            $lookup: {
              from: "UserDetails",
              // Name of the UserDetails collection
              localField: "_id",
              foreignField: "userId",
              as: "userDetails"
            }
          }, {
            $unwind: {
              path: "$userDetails",
              preserveNullAndEmptyArrays: true
            }
          }, // Unwind the userDetails array
          {
            $addFields: {
              fullName: "$userDetails.fullName",
              email: "$userDetails.email",
              roleId: "$userDetails.roleId",
              organization: "$userDetails.organization"
            }
          }, {
            $project: {
              userDetails: 0
            }
          }]).exec());

        case 26:
          result = _context6.sent;
          return _context6.abrupt("return", sendToken(result[0], 200, res, role));

        case 28:
          _context6.next = 34;
          break;

        case 30:
          _context6.prev = 30;
          _context6.t0 = _context6["catch"](0);
          console.error(_context6.t0);
          return _context6.abrupt("return", res.status(400).json({
            message: "Internal Server Error"
          }));

        case 34:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 30]]);
});
var setProfileImage = catchAsyncErrors(function _callee7(req, res, next) {
  var userId, images, imagesReqBody, i, image, result, imageReqBody, user;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          // console.log(req, "req");
          userId = req.user._id;
          images = req.files; // console.log(images, "img");

          if (images) {
            _context7.next = 5;
            break;
          }

          return _context7.abrupt("return", res.json({
            message: "Please Select an Image"
          }));

        case 5:
          imagesReqBody = [];
          i = 0;

        case 7:
          if (!(i < images.length)) {
            _context7.next = 20;
            break;
          }

          image = images[i];
          _context7.next = 11;
          return regeneratorRuntime.awrap(itemImageS3.uploadFile(image));

        case 11:
          result = _context7.sent;
          _context7.next = 14;
          return regeneratorRuntime.awrap(unlinkFile(image.path));

        case 14:
          if (image.fieldname == "image") isDisplayImage = true;
          imageReqBody = {
            imageLink: "/items/image/".concat(result.Key)
          }; // console.log(imageReqBody,result);

          imagesReqBody.push(imageReqBody);

        case 17:
          ++i;
          _context7.next = 7;
          break;

        case 20:
          _context7.next = 22;
          return regeneratorRuntime.awrap(userDetails.findOne({
            userId: userId
          }));

        case 22:
          user = _context7.sent;

          if (user) {
            user.img = imagesReqBody[0].imageLink;
          } else {
            user = userDetails.create({
              userId: userId,
              img: imagesReqBody[0].imageLink
            });
          }

          _context7.next = 26;
          return regeneratorRuntime.awrap(user.save());

        case 26:
          // Respond to the client
          res.status(201).json({
            message: "File uploaded and saved successfully",
            user: user
          });
          _context7.next = 33;
          break;

        case 29:
          _context7.prev = 29;
          _context7.t0 = _context7["catch"](0);
          console.log(_context7.t0, "err");
          res.status(200).json({
            error: "Internal server error"
          });

        case 33:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 29]]);
});
var userDetailUpdate = catchAsyncErrors(function _callee8(req, res, next) {
  var _req$body4, fullName, organization, phone, email, userId, user;

  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _req$body4 = req.body, fullName = _req$body4.fullName, organization = _req$body4.organization, phone = _req$body4.phone, email = _req$body4.email;
          userId = req.user._id;

          if (!(!fullName || !organization || !phone || !email)) {
            _context8.next = 7;
            break;
          }

          return _context8.abrupt("return", res.status(400).json({
            success: false,
            error: "Please enter all fields properly!"
          }));

        case 7:
          _context8.next = 9;
          return regeneratorRuntime.awrap(User.findOne({
            _id: userId
          }));

        case 9:
          user = _context8.sent;

          if (!user) {
            _context8.next = 20;
            break;
          }

          user.fullName = fullName;
          user.organization = organization;
          user.phone = phone;
          user.email = email;
          _context8.next = 17;
          return regeneratorRuntime.awrap(user.save());

        case 17:
          return _context8.abrupt("return", res.json({
            message: "User Details Updated",
            user: user
          }));

        case 20:
          return _context8.abrupt("return", res.status(400).json({
            success: false,
            error: "Can't Update User Details!"
          }));

        case 21:
          _context8.next = 26;
          break;

        case 23:
          _context8.prev = 23;
          _context8.t0 = _context8["catch"](0);
          return _context8.abrupt("return", res.status(400).json({
            message: "Internal Server Error"
          }));

        case 26:
        case "end":
          return _context8.stop();
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

var addUserDetails = catchAsyncErrors(function _callee9(req, res, next) {
  var userId, image, result, user;
  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          userId = req.user._id;
          image = req.file; // Changed to req.file to handle only one image
          // console.log(image, "img");

          _context9.prev = 2;

          if (image) {
            _context9.next = 5;
            break;
          }

          return _context9.abrupt("return", res.json({
            message: "Please Select an Image"
          }));

        case 5:
          _context9.next = 7;
          return regeneratorRuntime.awrap(itemImageS3.uploadFile(image));

        case 7:
          result = _context9.sent;
          _context9.next = 10;
          return regeneratorRuntime.awrap(unlinkFile(image.path));

        case 10:
          _context9.next = 12;
          return regeneratorRuntime.awrap(userDetails.findOne({
            userId: userId
          }));

        case 12:
          user = _context9.sent;

          if (user) {
            user.img = "/items/image/".concat(result.Key);
          } else {
            user = userDetails.create({
              userId: userId,
              img: "/items/image/".concat(result.Key)
            });
          }

          _context9.next = 16;
          return regeneratorRuntime.awrap(user.save());

        case 16:
          res.status(201).json({
            message: "User Details Updated successfully",
            user: user
          });
          _context9.next = 23;
          break;

        case 19:
          _context9.prev = 19;
          _context9.t0 = _context9["catch"](2);
          console.error(_context9.t0);
          res.status(500).json({
            message: "Internal server error"
          });

        case 23:
        case "end":
          return _context9.stop();
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
  setProfileImage: setProfileImage,
  userDetailUpdate: userDetailUpdate,
  addUserDetails: addUserDetails,
  profileComplete: profileComplete
};