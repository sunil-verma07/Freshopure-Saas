"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var catchAsyncErrors = require("../middleware/catchAsyncErrors");

var SubVendor = require("../models/subVendor");

var _require = require("mongodb"),
    ObjectId = _require.ObjectId;

var Items = require("../models/item");

var addVendor = catchAsyncErrors(function _callee(req, res, next) {
  var _req$body, fullName, phone, vendorId, vendor, newVendor;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, fullName = _req$body.fullName, phone = _req$body.phone;
          vendorId = req.user._id;

          if (!(!fullName || !phone)) {
            _context.next = 7;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: "Please enter all feilds properly!"
          }));

        case 7:
          _context.next = 9;
          return regeneratorRuntime.awrap(SubVendor.findOne({
            phone: phone
          }));

        case 9:
          vendor = _context.sent;

          if (!vendor) {
            _context.next = 14;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            success: false,
            error: "Vendor already exists!"
          }));

        case 14:
          _context.next = 16;
          return regeneratorRuntime.awrap(SubVendor.create({
            vendorId: new Object(vendorId),
            fullName: fullName,
            phone: phone
          }));

        case 16:
          newVendor = _context.sent;
          res.status(200).json({
            message: "New Vendor Added!"
          });

        case 18:
          _context.next = 24;
          break;

        case 20:
          _context.prev = 20;
          _context.t0 = _context["catch"](0);
          console.log(_context.t0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 24:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 20]]);
});
var removeVendor = catchAsyncErrors(function _callee2(req, res, next) {
  var vendorId, removedVendor;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          vendorId = req.body; // Assuming vendorId is provided in the request parameters
          // Check if vendorId is provided

          if (vendorId) {
            _context2.next = 4;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Vendor ID is required"
          }));

        case 4:
          console.log(vendorId); // Find vendor by ID and remove it

          _context2.next = 7;
          return regeneratorRuntime.awrap(SubVendor.find(vendorId));

        case 7:
          removedVendor = _context2.sent;
          console.log(removeVendor); // Check if vendor was found and removed

          if (!removedVendor) {
            _context2.next = 15;
            break;
          }

          _context2.next = 12;
          return regeneratorRuntime.awrap(SubVendor.deleteOne({
            vendorId: vendorId
          }));

        case 12:
          res.status(200).json({
            success: true,
            message: "Vendor removed successfully"
          });
          _context2.next = 16;
          break;

        case 15:
          return _context2.abrupt("return", res.status(404).json({
            success: false,
            message: "Vendor not found"
          }));

        case 16:
          _context2.next = 22;
          break;

        case 18:
          _context2.prev = 18;
          _context2.t0 = _context2["catch"](0);
          console.log(_context2.t0);
          res.status(500).json({
            success: false,
            error: "Internal server error"
          });

        case 22:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 18]]);
});

var addItemToVendor = function addItemToVendor(req, res) {
  var _req$body2, vendorId, itemIds, subVendorPresent, elementFound, items;

  return regeneratorRuntime.async(function addItemToVendor$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _req$body2 = req.body, vendorId = _req$body2.vendorId, itemIds = _req$body2.itemIds; // Check if vendorId and itemIds are provided

          if (!(!vendorId || !itemIds)) {
            _context3.next = 4;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            success: false,
            message: "Vendor ID and an array of Item IDs are required"
          }));

        case 4:
          _context3.next = 6;
          return regeneratorRuntime.awrap(SubVendor.findOne({
            _id: new ObjectId(vendorId)
          }));

        case 6:
          subVendorPresent = _context3.sent;
          _context3.next = 9;
          return regeneratorRuntime.awrap(SubVendor.findOne({
            _id: new ObjectId(vendorId),
            assignedItems: {
              $elemMatch: {
                itemId: itemIds[0].itemId
              }
            }
          }));

        case 9:
          elementFound = _context3.sent;

          if (elementFound) {
            _context3.next = 21;
            break;
          }

          if (!subVendorPresent) {
            _context3.next = 18;
            break;
          }

          items = [].concat(_toConsumableArray(subVendorPresent.assignedItems), _toConsumableArray(itemIds));
          _context3.next = 15;
          return regeneratorRuntime.awrap(SubVendor.updateOne({
            _id: new ObjectId(vendorId)
          }, {
            $set: {
              assignedItems: items
            }
          }));

        case 15:
          res.status(200).json({
            message: "Items assigned to Sub Vendor"
          });
          _context3.next = 19;
          break;

        case 18:
          res.status(400).json({
            error: "Item already added"
          });

        case 19:
          _context3.next = 22;
          break;

        case 21:
          res.status(400).json({
            error: "Item already added"
          });

        case 22:
          _context3.next = 28;
          break;

        case 24:
          _context3.prev = 24;
          _context3.t0 = _context3["catch"](0);
          console.log(_context3.t0);
          res.status(500).json({
            success: false,
            error: "Internal server error"
          });

        case 28:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 24]]);
};

var removeItemsFromVendor = catchAsyncErrors(function _callee3(req, res, next) {
  var _id, itemIds, updatedVendor;

  return regeneratorRuntime.async(function _callee3$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _id = req.body._id;
          itemIds = req.body.itemIds; // Check if vendorId and itemIds are provided

          if (!(!_id || !itemIds)) {
            _context4.next = 5;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            success: false,
            message: "Vendor ID and and Item ID are required"
          }));

        case 5:
          _context4.next = 7;
          return regeneratorRuntime.awrap(SubVendor.findOneAndUpdate({
            _id: _id
          }, {
            $pull: {
              assignedItems: {
                itemId: {
                  $in: itemIds
                }
              }
            }
          }, {
            "new": true
          }));

        case 7:
          updatedVendor = _context4.sent;

          if (!updatedVendor) {
            _context4.next = 12;
            break;
          }

          res.status(200).json({
            success: true,
            message: "Items removed from vendor successfully",
            vendor: updatedVendor
          });
          _context4.next = 13;
          break;

        case 12:
          return _context4.abrupt("return", res.status(404).json({
            success: false,
            message: "Vendor not found"
          }));

        case 13:
          _context4.next = 19;
          break;

        case 15:
          _context4.prev = 15;
          _context4.t0 = _context4["catch"](0);
          console.log(_context4.t0);
          res.status(500).json({
            success: false,
            error: "Internal server error"
          });

        case 19:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 15]]);
});
var getSubVendorItems = catchAsyncErrors(function _callee4(req, res, next) {
  var subvendorId, pipeline, AssignedItems;
  return regeneratorRuntime.async(function _callee4$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          subvendorId = req.body._id;
          pipeline = [{
            $match: {
              _id: new ObjectId(subvendorId)
            }
          }, {
            $unwind: "$assignedItems"
          }, {
            $lookup: {
              from: "Items",
              localField: "assignedItems.itemId",
              foreignField: "_id",
              as: "items"
            }
          }, {
            $unwind: "$items"
          }, {
            $lookup: {
              from: "Images",
              localField: "assignedItems.itemId",
              foreignField: "itemId",
              as: "items.image"
            }
          }, {
            $unwind: "$items.image"
          }];
          _context5.next = 5;
          return regeneratorRuntime.awrap(SubVendor.aggregate(pipeline));

        case 5:
          AssignedItems = _context5.sent;

          if (!AssignedItems) {
            _context5.next = 10;
            break;
          }

          res.status(200).json({
            success: true,
            message: "successful",
            items: AssignedItems,
            length: AssignedItems.length
          });
          _context5.next = 11;
          break;

        case 10:
          return _context5.abrupt("return", res.status(404).json({
            success: false,
            message: "Vendor not found"
          }));

        case 11:
          _context5.next = 17;
          break;

        case 13:
          _context5.prev = 13;
          _context5.t0 = _context5["catch"](0);
          console.log(_context5.t0);
          res.status(500).json({
            success: false,
            error: "Internal server error"
          });

        case 17:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 13]]);
});
module.exports = {
  addVendor: addVendor,
  removeVendor: removeVendor,
  addItemToVendor: addItemToVendor,
  removeItemsFromVendor: removeItemsFromVendor,
  getSubVendorItems: getSubVendorItems
};