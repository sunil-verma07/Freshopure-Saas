"use strict";

var ErrorHandler = require("../utils/errorhander.js");

var catchAsyncError = require("../middleware/catchAsyncErrors.js");

var _require = require("../dbClient.js"),
    getDatabase = _require.getDatabase;

var _require2 = require("mongodb"),
    ObjectId = _require2.ObjectId;

var db = getDatabase();

var Address = require("../models/address.js");

var addAddress = catchAsyncError(function _callee(req, res, next) {
  var HotelId, _req$body, addressLine1, addressLine2, state, city, pinCode, address;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          HotelId = req.user._id;
          _req$body = req.body, addressLine1 = _req$body.addressLine1, addressLine2 = _req$body.addressLine2, state = _req$body.state, city = _req$body.city, pinCode = _req$body.pinCode;
          _context.next = 5;
          return regeneratorRuntime.awrap(Address.updateMany({
            HotelId: new ObjectId(HotelId),
            selected: true
          }, {
            $set: {
              selected: false
            }
          }));

        case 5:
          address = new Address({
            HotelId: HotelId,
            addressLine1: addressLine1,
            addressLine2: addressLine2,
            state: state,
            city: city,
            pinCode: pinCode
          });
          _context.next = 8;
          return regeneratorRuntime.awrap(address.save());

        case 8:
          res.status(200).json({
            message: "Address Added"
          });
          _context.next = 14;
          break;

        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 11]]);
});
var removeAddress = catchAsyncError(function _callee2(req, res, next) {
  var UserId, addressId, currentAddress;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          UserId = req.user._id;
          addressId = req.body.addressId;
          _context2.next = 5;
          return regeneratorRuntime.awrap(Address.findOne({
            _id: new ObjectId(addressId)
          }));

        case 5:
          currentAddress = _context2.sent;

          if (currentAddress) {
            _context2.next = 8;
            break;
          }

          return _context2.abrupt("return", res.status(404).json({
            error: "Address not found"
          }));

        case 8:
          console.log(currentAddress);

          if (!(currentAddress.selected == true)) {
            _context2.next = 13;
            break;
          }

          throw new Error("Selected Address Cannot be removed");

        case 13:
          _context2.next = 15;
          return regeneratorRuntime.awrap(Address.deleteOne({
            _id: new ObjectId(addressId)
          }));

        case 15:
          res.status(200).json({
            message: "Address removed"
          });

        case 16:
          _context2.next = 21;
          break;

        case 18:
          _context2.prev = 18;
          _context2.t0 = _context2["catch"](0);

          if (_context2.t0.message == "Selected Address Cannot be removed") {
            res.status(400).json({
              error: _context2.t0.message
            });
          } else {
            console.log(_context2.t0);
            res.status(500).json({
              error: "Internal server"
            });
          }

        case 21:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 18]]);
});
var getAllAddress = catchAsyncError(function _callee3(req, res, next) {
  var UserId, hotelAddresses;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          // console.log("controller");
          UserId = req.user._id; // console.log(UserId);
          // const { addressId } = req.body;

          _context3.next = 4;
          return regeneratorRuntime.awrap(Address.find({
            HotelId: new ObjectId(UserId),
            selected: false
          }));

        case 4:
          hotelAddresses = _context3.sent;
          // console.log(hotelAddresses);
          res.status(200).json({
            hotelAddresses: hotelAddresses
          });
          _context3.next = 12;
          break;

        case 8:
          _context3.prev = 8;
          _context3.t0 = _context3["catch"](0);
          console.log(_context3.t0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 12:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var getSelectedAddress = catchAsyncError(function _callee4(req, res, next) {
  var UserId, address;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          UserId = req.user._id;
          _context4.next = 4;
          return regeneratorRuntime.awrap(Address.findOne({
            HotelId: new ObjectId(UserId),
            selected: true
          }));

        case 4:
          address = _context4.sent;
          console.log(UserId);
          res.status(200).json({
            address: address
          });
          _context4.next = 12;
          break;

        case 9:
          _context4.prev = 9;
          _context4.t0 = _context4["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 12:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
var updateSelectedAddress = catchAsyncError(function _callee5(req, res, next) {
  var UserId, addressId;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          UserId = req.user._id;
          addressId = req.body.addressId;
          _context5.next = 5;
          return regeneratorRuntime.awrap(Address.updateMany({
            UserId: new ObjectId(UserId),
            selected: true
          }, {
            $set: {
              selected: false
            }
          }));

        case 5:
          _context5.next = 7;
          return regeneratorRuntime.awrap(Address.updateOne({
            _id: new ObjectId(addressId)
          }, {
            $set: {
              selected: true
            }
          }));

        case 7:
          res.status(200).json({
            message: "Updated selected address"
          });
          _context5.next = 13;
          break;

        case 10:
          _context5.prev = 10;
          _context5.t0 = _context5["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 13:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
module.exports = {
  addAddress: addAddress,
  removeAddress: removeAddress,
  getAllAddress: getAllAddress,
  getSelectedAddress: getSelectedAddress,
  updateSelectedAddress: updateSelectedAddress
};