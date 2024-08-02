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
  var HotelId, _req$body, addressLine1, addressLine2, state, city, pinCode, address, hotelAddresses;

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
          _context.next = 10;
          return regeneratorRuntime.awrap(getAddressFunc(HotelId));

        case 10:
          hotelAddresses = _context.sent;
          res.status(200).json({
            message: "Address Added",
            hotelAddresses: hotelAddresses
          });
          _context.next = 17;
          break;

        case 14:
          _context.prev = 14;
          _context.t0 = _context["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 14]]);
});
var removeAddress = catchAsyncError(function _callee2(req, res, next) {
  var UserId, addressId, currentAddress, hotelAddresses;
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
          if (!(currentAddress.selected === true)) {
            _context2.next = 12;
            break;
          }

          throw new Error("Selected Address Cannot be removed");

        case 12:
          _context2.next = 14;
          return regeneratorRuntime.awrap(Address.deleteOne({
            _id: new ObjectId(addressId)
          }));

        case 14:
          _context2.next = 16;
          return regeneratorRuntime.awrap(getAddressFunc(UserId));

        case 16:
          hotelAddresses = _context2.sent;
          res.status(200).json({
            message: "Address removed",
            hotelAddresses: hotelAddresses
          });

        case 18:
          _context2.next = 23;
          break;

        case 20:
          _context2.prev = 20;
          _context2.t0 = _context2["catch"](0);

          if (_context2.t0.message == "Selected Address Cannot be removed") {
            res.status(400).json({
              error: _context2.t0.message
            });
          } else {
            // console.log(error);
            res.status(500).json({
              error: "Internal server"
            });
          }

        case 23:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 20]]);
});
var getAllAddress = catchAsyncError(function _callee3(req, res, next) {
  var UserId, hotelAddresses;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          // console.log("controller");
          UserId = req.user._id;
          _context3.next = 4;
          return regeneratorRuntime.awrap(getAddressFunc(UserId));

        case 4:
          hotelAddresses = _context3.sent;
          res.status(200).json({
            hotelAddresses: hotelAddresses
          });
          _context3.next = 11;
          break;

        case 8:
          _context3.prev = 8;
          _context3.t0 = _context3["catch"](0);
          // console.log(error);
          res.status(500).json({
            error: "Internal server error"
          });

        case 11:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var updateSelectedAddress = catchAsyncError(function _callee4(req, res, next) {
  var UserId, addressId, hotelAddresses;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          UserId = req.user._id;
          addressId = req.body.addressId;
          _context4.next = 5;
          return regeneratorRuntime.awrap(Address.updateMany({
            HotelId: new ObjectId(UserId),
            selected: true
          }, {
            $set: {
              selected: false
            }
          }));

        case 5:
          _context4.next = 7;
          return regeneratorRuntime.awrap(Address.updateOne({
            _id: new ObjectId(addressId)
          }, {
            $set: {
              selected: true
            }
          }));

        case 7:
          _context4.next = 9;
          return regeneratorRuntime.awrap(getAddressFunc(UserId));

        case 9:
          hotelAddresses = _context4.sent;
          res.status(200).json({
            message: "Updated selected address",
            hotelAddresses: hotelAddresses
          });
          _context4.next = 16;
          break;

        case 13:
          _context4.prev = 13;
          _context4.t0 = _context4["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 16:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 13]]);
});

var getAddressFunc = function getAddressFunc(hotelId) {
  var selectedAddress, allAddresses;
  return regeneratorRuntime.async(function getAddressFunc$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(Address.findOne({
            HotelId: new ObjectId(hotelId),
            selected: true
          }));

        case 2:
          selectedAddress = _context5.sent;
          _context5.next = 5;
          return regeneratorRuntime.awrap(Address.find({
            HotelId: new ObjectId(hotelId),
            selected: false
          }));

        case 5:
          allAddresses = _context5.sent;
          return _context5.abrupt("return", {
            selectedAddress: selectedAddress,
            allAddresses: allAddresses
          });

        case 7:
        case "end":
          return _context5.stop();
      }
    }
  });
};

module.exports = {
  addAddress: addAddress,
  removeAddress: removeAddress,
  getAllAddress: getAllAddress,
  updateSelectedAddress: updateSelectedAddress
};