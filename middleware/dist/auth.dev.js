"use strict";

var catchAsyncErrors = require("./catchAsyncErrors.js");

var jwt = require("jsonwebtoken");

var User = require("../models/user.js");

var Role = require("../models/role.js");

require("dotenv").config();

var cookieParser = require("cookie-parser");

exports.authMiddleware = function _callee(req, res, next) {
  var token, decoded;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          token = req.headers.token;

          if (token) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(401).json({
            error: "No token provided"
          }));

        case 3:
          _context.prev = 3;
          decoded = jwt.verify(token, process.env.JWT_SECRET);
          _context.next = 7;
          return regeneratorRuntime.awrap(User.findById(decoded.id));

        case 7:
          req.user = _context.sent;
          next();
          _context.next = 15;
          break;

        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](3);
          console.log(_context.t0);
          res.status(401).json({
            error: "Invalid token"
          });

        case 15:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[3, 11]]);
};

exports.isAuthenticatedUser = catchAsyncErrors(function _callee2(req, res, next) {
  var token, decodedData;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          token = req.cookies.token;
          console.log(token);

          if (token) {
            _context2.next = 6;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            success: false,
            error: "Unauthenticated User"
          }));

        case 6:
          _context2.prev = 6;
          decodedData = jwt.verify(token, process.env.JWT_SECRET);
          _context2.next = 10;
          return regeneratorRuntime.awrap(User.findById(decodedData.id));

        case 10:
          req.user = _context2.sent;
          _context2.next = 16;
          break;

        case 13:
          _context2.prev = 13;
          _context2.t0 = _context2["catch"](6);
          return _context2.abrupt("return", res.status(500).json({
            success: false,
            error: _context2.t0.message
          }));

        case 16:
          next();

        case 17:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[6, 13]]);
});

exports.authorizeRoles = function () {
  for (var _len = arguments.length, roles = new Array(_len), _key = 0; _key < _len; _key++) {
    roles[_key] = arguments[_key];
  }

  return function _callee3(req, res, next) {
    var userRole;
    return regeneratorRuntime.async(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return regeneratorRuntime.awrap(Role.findOne({
              _id: req.user.roleId
            }));

          case 2:
            userRole = _context3.sent;

            if (roles.includes(userRole.name.toLowerCase())) {
              _context3.next = 7;
              break;
            }

            return _context3.abrupt("return", res.status(403).json({
              success: false,
              error: "".concat(userRole.name, " is not allowed to access this resouce")
            }));

          case 7:
            next();

          case 8:
          case "end":
            return _context3.stop();
        }
      }
    });
  };
};

exports.profileComplete = catchAsyncErrors(function _callee4(req, res, next) {
  var user;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          try {
            user = req.user;

            if (user.isProfieComplete == true) {
              if (user.isProfileReviewed == true && user.reviewStatus == "Approved") {
                next();
              } else {
                res.status(406).json({
                  profileComplete: false,
                  isProfileReviewed: user.isProfileReviewed,
                  reviewStatus: user.reviewStatus,
                  error: "Profile Not Reviewed"
                });
              }
            } else {
              res.status(406).json({
                profileComplete: false,
                error: "Profile Not Completed"
              });
            }
          } catch (error) {
            res.status(500).json({
              error: error
            });
          }

        case 1:
        case "end":
          return _context4.stop();
      }
    }
  });
});