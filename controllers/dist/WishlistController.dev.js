"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var ErrorHandler = require("../utils/errorhander.js");

var catchAsyncError = require("../middleware/catchAsyncErrors.js");

var _require = require("../dbClient.js"),
    getDatabase = _require.getDatabase;

var _require2 = require("mongodb"),
    ObjectId = _require2.ObjectId;

var Wishlist = require("../models/wishlist.js");

var db = getDatabase(); // const Wishlist = db.collection('hotelwishlists');
// const Items = db.collection('DefaultItems');
// const collectionImages = db.collection('Images');

var addItemToWishlist = catchAsyncError(function _callee(req, res, next) {
  var wishlistItem, hotelId, wishlistPresent, elementFound, items, wishlistData, wishlist, _wishlistData;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          wishlistItem = req.body.wishlistItem;
          hotelId = req.user._id;
          _context.next = 5;
          return regeneratorRuntime.awrap(Wishlist.find({
            hotelId: new ObjectId(hotelId)
          }));

        case 5:
          wishlistPresent = _context.sent;
          _context.next = 8;
          return regeneratorRuntime.awrap(Wishlist.findOne({
            hotelId: new ObjectId(hotelId),
            wishlistItem: {
              $elemMatch: {
                itemId: wishlistItem[0].itemId
              }
            }
          }));

        case 8:
          elementFound = _context.sent;

          if (elementFound) {
            _context.next = 35;
            break;
          }

          if (!(wishlistPresent.length > 0)) {
            _context.next = 20;
            break;
          }

          items = [].concat(_toConsumableArray(wishlistPresent[0].wishlistItem), _toConsumableArray(wishlistItem));
          _context.next = 14;
          return regeneratorRuntime.awrap(Wishlist.updateOne({
            hotelId: new ObjectId(hotelId)
          }, {
            $set: {
              wishlistItem: items
            }
          }));

        case 14:
          _context.next = 16;
          return regeneratorRuntime.awrap(getWishlistItemFunc(hotelId));

        case 16:
          wishlistData = _context.sent;
          res.status(200).json({
            message: "Items added to Wishist",
            wishlistData: wishlistData
          });
          _context.next = 33;
          break;

        case 20:
          _context.prev = 20;
          wishlist = new Wishlist({
            hotelId: hotelId,
            wishlistItem: wishlistItem
          });
          _context.next = 24;
          return regeneratorRuntime.awrap(wishlist.save());

        case 24:
          _context.next = 26;
          return regeneratorRuntime.awrap(getWishlistItemFunc(hotelId));

        case 26:
          _wishlistData = _context.sent;
          res.status(200).json({
            message: "Items added to Wishist",
            wishlistData: _wishlistData
          });
          _context.next = 33;
          break;

        case 30:
          _context.prev = 30;
          _context.t0 = _context["catch"](20);
          res.status(500).json({
            error: "Internal server error"
          });

        case 33:
          _context.next = 36;
          break;

        case 35:
          res.status(400).json({
            error: "Item already added"
          });

        case 36:
          _context.next = 41;
          break;

        case 38:
          _context.prev = 38;
          _context.t1 = _context["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 41:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 38], [20, 30]]);
});
var removeItemFormWishlist = catchAsyncError(function _callee2(req, res, next) {
  var Itemid, hotelId, wishlistPresent, indexToRemove, wishlistData;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          Itemid = req.body.Itemid;
          hotelId = req.user._id;
          _context2.next = 5;
          return regeneratorRuntime.awrap(Wishlist.find({
            hotelId: new ObjectId(hotelId)
          }));

        case 5:
          wishlistPresent = _context2.sent;

          if (!(wishlistPresent.length > 0)) {
            _context2.next = 19;
            break;
          }

          indexToRemove = wishlistPresent[0].wishlistItem.findIndex(function (item) {
            return item.itemId == Itemid;
          });

          if (!(indexToRemove != -1)) {
            _context2.next = 16;
            break;
          }

          wishlistPresent[0].wishlistItem.splice(indexToRemove, 1);
          _context2.next = 12;
          return regeneratorRuntime.awrap(Wishlist.updateOne({
            hotelId: new ObjectId(hotelId)
          }, {
            $set: {
              wishlistItem: wishlistPresent[0].wishlistItem
            }
          }));

        case 12:
          _context2.next = 14;
          return regeneratorRuntime.awrap(getWishlistItemFunc(hotelId));

        case 14:
          wishlistData = _context2.sent;
          return _context2.abrupt("return", res.status(200).json({
            message: "item Removed From WishList",
            wishlistData: wishlistData
          }));

        case 16:
          return _context2.abrupt("return", res.status(400).json({
            error: "No item found"
          }));

        case 19:
          return _context2.abrupt("return", res.status(400).json({
            error: "No items Found"
          }));

        case 20:
          _context2.next = 25;
          break;

        case 22:
          _context2.prev = 22;
          _context2.t0 = _context2["catch"](0);
          return _context2.abrupt("return", res.status(500).json({
            error: "Internal server error"
          }));

        case 25:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 22]]);
});
var getWishlistItems = catchAsyncError(function _callee3(req, res, next) {
  var hotelId, wishlistData;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          hotelId = req.user._id;
          _context3.next = 4;
          return regeneratorRuntime.awrap(getWishlistItemFunc(hotelId));

        case 4:
          wishlistData = _context3.sent;
          console.log(wishlistData, "wishliststData");
          res.status(200).json({
            wishlistData: wishlistData
          });
          _context3.next = 13;
          break;

        case 9:
          _context3.prev = 9;
          _context3.t0 = _context3["catch"](0);
          console.log(_context3.t0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 13:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 9]]);
});

var getWishlistItemFunc = function getWishlistItemFunc(hotelId) {
  var pipeline, wishlistData;
  return regeneratorRuntime.async(function getWishlistItemFunc$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          pipeline = [{
            $match: {
              hotelId: hotelId
            }
          }, {
            $unwind: "$wishlistItem"
          }, {
            $lookup: {
              from: "Items",
              localField: "wishlistItem.itemId",
              foreignField: "_id",
              as: "items"
            }
          }, {
            $unwind: "$items"
          }, {
            $lookup: {
              from: "Images",
              localField: "wishlistItem.itemId",
              foreignField: "itemId",
              as: "items.image"
            }
          }, {
            $unwind: "$items.image"
          }];
          _context4.next = 3;
          return regeneratorRuntime.awrap(Wishlist.aggregate(pipeline));

        case 3:
          wishlistData = _context4.sent;
          return _context4.abrupt("return", wishlistData);

        case 5:
        case "end":
          return _context4.stop();
      }
    }
  });
};

module.exports = {
  addItemToWishlist: addItemToWishlist,
  removeItemFormWishlist: removeItemFormWishlist,
  getWishlistItems: getWishlistItems
};