"use strict";

var msg91 = require("msg91")["default"];

msg91.initialize({
  authKey: process.env.AUTH_KEY_MSG91
});

function sendOtp(phone) {
  var _otp, res;

  return regeneratorRuntime.async(function sendOtp$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          console.log(phone);
          _otp = msg91.getOTP("64dc68c2d6fc05312a7edec3", {
            length: 4
          });
          _context.next = 5;
          return regeneratorRuntime.awrap(_otp.send("91" + phone));

        case 5:
          res = _context.sent;
          console.log(res, "res");
          return _context.abrupt("return", res);

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          return _context.abrupt("return", _context.t0);

        case 13:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 10]]);
}

function verifyOtp(phone, code) {
  var _otp2, res;

  return regeneratorRuntime.async(function verifyOtp$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _otp2 = msg91.getOTP("64dc68c2d6fc05312a7edec3", {
            length: 4
          });
          _context2.next = 4;
          return regeneratorRuntime.awrap(_otp2.verify("91" + phone, code));

        case 4:
          res = _context2.sent;
          return _context2.abrupt("return", res);

        case 8:
          _context2.prev = 8;
          _context2.t0 = _context2["catch"](0);
          return _context2.abrupt("return", _context2.t0);

        case 11:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 8]]);
}

function resendOtp(phone) {
  var res;
  return regeneratorRuntime.async(function resendOtp$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(otp.retry("91" + phone));

        case 3:
          res = _context3.sent;
          return _context3.abrupt("return", res);

        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          return _context3.abrupt("return", _context3.t0);

        case 10:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 7]]);
}

module.exports = {
  sendOtp: sendOtp,
  verifyOtp: verifyOtp,
  resendOtp: resendOtp
};