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

var HotelItemPrice = require("../models/hotelItemPrice.js");

var VendorItems = require("../models/VendorItems.js");

var db = getDatabase();

var HotelVendorLink = require("../models/hotelVendorLink.js");

var catchAsyncErrors = require("../middleware/catchAsyncErrors.js");

var SubVendor = require("../models/subVendor.js");

var _require3 = require("../utils/sendWhatsappNotification.js"),
    sendWhatsappmessge = _require3.sendWhatsappmessge;

var user = require("../models/user.js");

var Image = require("../models/image.js");

var Orders = require("../models/order.js");

var setHotelItemPrice = catchAsyncError(function _callee(req, res, next) {
  var _req$body, itemId, hotelId, categoryId, price, vendorId, linkPresent, itemPresent;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, itemId = _req$body.itemId, hotelId = _req$body.hotelId, categoryId = _req$body.categoryId, price = _req$body.price;
          vendorId = req.user._id;

          if (!(!itemId || !hotelId || !price || !categoryId)) {
            _context.next = 5;
            break;
          }

          throw new Error("All fields are required.");

        case 5:
          _context.next = 7;
          return regeneratorRuntime.awrap(HotelVendorLink.findOne({
            vendorId: new ObjectId(vendorId),
            hotelId: new Object(hotelId)
          }));

        case 7:
          linkPresent = _context.sent;

          if (linkPresent) {
            _context.next = 10;
            break;
          }

          return _context.abrupt("return", res.status(500).json({
            message: "Hotel is not linked to vendor"
          }));

        case 10:
          _context.next = 12;
          return regeneratorRuntime.awrap(HotelItemPrice.findOne({
            $and: [{
              vendorId: new ObjectId(vendorId)
            }, {
              hotelId: new ObjectId(hotelId)
            }, {
              itemId: new ObjectId(itemId)
            }]
          }));

        case 12:
          itemPresent = _context.sent;

          if (itemPresent) {
            _context.next = 19;
            break;
          }

          _context.next = 16;
          return regeneratorRuntime.awrap(HotelItemPrice.create({
            vendorId: vendorId,
            hotelId: hotelId,
            itemId: itemId,
            categoryId: categoryId,
            todayCostPrice: price
          }));

        case 16:
          res.status(200).json({
            message: "Price updated successfully."
          });
          _context.next = 24;
          break;

        case 19:
          itemPresent.yesterdayCostPrice = itemPresent.todayCostPrice;
          itemPresent.todayCostPrice = price;
          _context.next = 23;
          return regeneratorRuntime.awrap(itemPresent.save());

        case 23:
          res.status(200).json({
            message: "Price updated successfully."
          });

        case 24:
          _context.next = 30;
          break;

        case 26:
          _context.prev = 26;
          _context.t0 = _context["catch"](0);
          console.log(_context.t0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 30:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 26]]);
});
var orderHistoryForVendors = catchAsyncError(function _callee2(req, res, next) {
  var vendorId, orderData;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          vendorId = req.user._id;
          _context2.next = 4;
          return regeneratorRuntime.awrap(HotelVendorLink.aggregate([{
            $match: {
              vendorId: vendorId
            }
          }, {
            $lookup: {
              from: "Users",
              localField: "hotelId",
              foreignField: "_id",
              as: "hotelDetails"
            }
          }, {
            $unwind: "$hotelDetails"
          }, {
            $lookup: {
              from: "orders",
              localField: "hotelId",
              foreignField: "hotelId",
              as: "hotelOrders"
            }
          }, {
            $unwind: "$hotelOrders"
          }, {
            $lookup: {
              from: "orderstatuses",
              localField: "hotelOrders.orderStatus",
              foreignField: "_id",
              as: "hotelOrders.orderStatuses"
            }
          }, {
            $unwind: "$hotelOrders.orderStatuses"
          }, {
            $lookup: {
              from: "Items",
              localField: "hotelOrders.orderedItems.itemId",
              foreignField: "_id",
              as: "items"
            }
          }, {
            $unwind: "$items"
          }, {
            $lookup: {
              from: "Images",
              localField: "items._id",
              foreignField: "itemId",
              as: "images"
            }
          }, {
            $group: {
              _id: "$hotelOrders._id",
              hotelId: {
                $first: "$hotelId"
              },
              hotelDetails: {
                $first: "$hotelDetails"
              },
              orderData: {
                $first: "$hotelOrders"
              },
              orderedItems: {
                $push: {
                  $mergeObjects: ["$items", {
                    images: "$images"
                  }]
                }
              }
            }
          }, {
            $project: {
              _id: 0,
              hotelId: 1,
              hotelDetails: 1,
              orderData: 1,
              orderedItems: 2
            }
          }]));

        case 4:
          orderData = _context2.sent;
          res.status(200).json({
            status: "success",
            data: orderData
          });
          _context2.next = 11;
          break;

        case 8:
          _context2.prev = 8;
          _context2.t0 = _context2["catch"](0);
          next(_context2.t0);

        case 11:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var hotelsLinkedWithVendor = catchAsyncError(function _callee3(req, res, next) {
  var vendorId, orderData;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          vendorId = req.user._id;
          _context3.next = 4;
          return regeneratorRuntime.awrap(HotelVendorLink.aggregate([{
            $match: {
              vendorId: vendorId
            }
          }, {
            $lookup: {
              from: "orders",
              localField: "hotelId",
              foreignField: "hotelId",
              as: "hotelOrders"
            }
          }, {
            $lookup: {
              from: "Users",
              localField: "hotelId",
              foreignField: "_id",
              as: "hotelDetails"
            }
          }, {
            $unwind: "$hotelDetails"
          }, {
            $group: {
              _id: "$hotelOrders._id",
              hotelId: {
                $first: "$hotelId"
              },
              hotelDetails: {
                $first: "$hotelDetails"
              },
              orderData: {
                $first: "$hotelOrders"
              }
            }
          }, {
            $project: {
              _id: 0,
              hotelId: 1,
              hotelDetails: 1 // orderData: 1,
              // orderedItems: 2,

            }
          }]));

        case 4:
          orderData = _context3.sent;
          res.status(200).json({
            status: "success",
            data: orderData
          });
          _context3.next = 11;
          break;

        case 8:
          _context3.prev = 8;
          _context3.t0 = _context3["catch"](0);
          next(_context3.t0);

        case 11:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var todayCompiledOrders = catchAsyncError(function _callee4(req, res, next) {
  var vendorId, today, orderData;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          vendorId = req.user._id; // Get today's date

          today = new Date();
          today.setHours(0, 0, 0, 0);
          _context4.next = 6;
          return regeneratorRuntime.awrap(HotelVendorLink.aggregate([{
            $match: {
              vendorId: vendorId
            }
          }, // {
          //   $lookup: {
          //     from: "Users",
          //     localField: "hotelId",
          //     foreignField: "_id",
          //     as: "hotelDetails",
          //   },
          // },
          // {
          //   $unwind: "$hotelDetails", // Unwind hotel details (optional, if hotelDetails is usually a single document)
          // },
          {
            $lookup: {
              from: "orders",
              "let": {
                hotelId: "$hotelId"
              },
              pipeline: [{
                $match: {
                  $expr: {
                    $and: [{
                      $eq: ["$hotelId", "$$hotelId"]
                    }, {
                      $gte: ["$createdAt", today]
                    } // Filter orders for today
                    ]
                  }
                }
              }],
              as: "hotelOrders"
            }
          }, {
            $unwind: "$hotelOrders"
          }, {
            $lookup: {
              from: "Users",
              localField: "hotelId",
              foreignField: "_id",
              as: "hotelOrders.hotelDetails"
            }
          }, {
            $unwind: "$hotelOrders.hotelDetails" // Unwind hotel details (optional, if hotelDetails is usually a single document)

          }, {
            $unwind: "$hotelOrders.orderedItems" // Unwind orderedItems array

          }, {
            $group: {
              _id: "$hotelOrders.orderedItems.itemId",
              totalQuantityOrderedGrams: {
                $sum: {
                  $add: [{
                    $multiply: ["$hotelOrders.orderedItems.quantity.kg", 1000]
                  }, // Convert kg to grams
                  "$hotelOrders.orderedItems.quantity.gram" // Add grams
                  ]
                }
              },
              // Total quantity ordered in grams
              itemDetails: {
                $first: "$hotelOrders.orderedItems"
              },
              // Take item details from the first document
              hotelOrders: {
                $push: "$hotelOrders"
              }
            }
          }, {
            $lookup: {
              from: "Items",
              localField: "_id",
              foreignField: "_id",
              as: "itemDetails"
            }
          }, {
            $lookup: {
              from: "Images",
              localField: "_id",
              foreignField: "itemId",
              as: "itemImages"
            }
          }, {
            $project: {
              _id: 0,
              totalQuantityOrdered: {
                kg: {
                  $floor: {
                    $divide: ["$totalQuantityOrderedGrams", 1000]
                  }
                },
                // Convert total grams to kg
                gram: {
                  $mod: ["$totalQuantityOrderedGrams", 1000]
                } // Calculate remaining grams

              },
              // Total quantity ordered in kg and grams
              itemDetails: {
                $arrayElemAt: ["$itemDetails", 0]
              },
              // Get the item details
              itemImages: {
                $arrayElemAt: ["$itemImages", 0]
              },
              // Get the item images
              hotelOrders: "$hotelOrders"
            }
          }]));

        case 6:
          orderData = _context4.sent;
          res.status(200).json({
            status: "success",
            data: orderData
          });
          _context4.next = 13;
          break;

        case 10:
          _context4.prev = 10;
          _context4.t0 = _context4["catch"](0);
          next(_context4.t0);

        case 13:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
var vendorItem = catchAsyncErrors(function _callee5(req, res, next) {
  var vendorId, AllItems, AssignedItems, assignedItemsArray, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item, Items;

  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          vendorId = req.user._id;
          _context5.next = 4;
          return regeneratorRuntime.awrap(HotelItemPrice.find({
            vendorId: vendorId
          }).select("itemId"));

        case 4:
          AllItems = _context5.sent;
          _context5.next = 7;
          return regeneratorRuntime.awrap(SubVendor.find({
            vendorId: vendorId
          }).select("assignedItems"));

        case 7:
          AssignedItems = _context5.sent;
          assignedItemsArray = [];
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context5.prev = 12;

          for (_iterator = AssignedItems[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            item = _step.value;
            assignedItemsArray.push.apply(assignedItemsArray, _toConsumableArray(item.assignedItems));
          }

          _context5.next = 20;
          break;

        case 16:
          _context5.prev = 16;
          _context5.t0 = _context5["catch"](12);
          _didIteratorError = true;
          _iteratorError = _context5.t0;

        case 20:
          _context5.prev = 20;
          _context5.prev = 21;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 23:
          _context5.prev = 23;

          if (!_didIteratorError) {
            _context5.next = 26;
            break;
          }

          throw _iteratorError;

        case 26:
          return _context5.finish(23);

        case 27:
          return _context5.finish(20);

        case 28:
          Items = AllItems.filter(function (obj1) {
            return !assignedItemsArray.some(function (obj2) {
              return obj1.itemId.equals(obj2.itemId);
            });
          });
          res.status(200).json({
            success: true,
            Items: Items
          }); // Sending the items back to the client

          _context5.next = 36;
          break;

        case 32:
          _context5.prev = 32;
          _context5.t1 = _context5["catch"](0);
          console.log(_context5.t1);
          res.status(500).json({
            success: false,
            error: "Internal server error"
          });

        case 36:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 32], [12, 16, 20, 28], [21,, 23, 27]]);
});
var getAllSubVendors = catchAsyncErrors(function _callee6(req, res, next) {
  var vendorId, data;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          vendorId = req.user._id;
          _context6.next = 4;
          return regeneratorRuntime.awrap(SubVendor.find({
            vendorId: vendorId
          }));

        case 4:
          data = _context6.sent;
          res.status(200).json({
            status: "success",
            data: data
          });
          _context6.next = 11;
          break;

        case 8:
          _context6.prev = 8;
          _context6.t0 = _context6["catch"](0);
          next(_context6.t0);

        case 11:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var sendCompiledOrders = catchAsyncErrors(function _callee7(req, res, next) {
  var vendorId, today, orderData, SubVendorsArray;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          vendorId = req.user._id; // Destructure the user object directly
          // Get today's date

          today = new Date();
          today.setHours(0, 0, 0, 0);
          _context7.next = 6;
          return regeneratorRuntime.awrap(HotelVendorLink.aggregate([{
            $match: {
              vendorId: new ObjectId(vendorId)
            } // Convert vendorId to ObjectId

          }, {
            $lookup: {
              from: "Users",
              localField: "hotelId",
              foreignField: "_id",
              as: "hotelDetails"
            }
          }, {
            $unwind: "$hotelDetails"
          }, {
            $lookup: {
              from: "orders",
              "let": {
                hotelId: "$hotelId"
              },
              pipeline: [{
                $match: {
                  $expr: {
                    $and: [{
                      $eq: ["$hotelId", "$$hotelId"]
                    }, {
                      $gte: ["$createdAt", today]
                    } // Filter orders for today
                    ]
                  }
                }
              }],
              as: "hotelOrders"
            }
          }, {
            $unwind: "$hotelOrders"
          }, {
            $unwind: "$hotelOrders.orderedItems" // Unwind orderedItems array

          }, {
            $group: {
              _id: "$hotelOrders.orderedItems.itemId",
              totalQuantityOrderedGrams: {
                $sum: {
                  $add: [{
                    $multiply: ["$hotelOrders.orderedItems.quantity.kg", 1000]
                  }, // Convert kg to grams
                  "$hotelOrders.orderedItems.quantity.gram" // Add grams
                  ]
                }
              },
              // Total quantity ordered in grams
              itemDetails: {
                $first: "$hotelOrders.orderedItems"
              } // Take item details from the first document

            }
          }, {
            $lookup: {
              from: "Items",
              localField: "_id",
              foreignField: "_id",
              as: "itemDetails"
            }
          }, {
            $lookup: {
              from: "Images",
              localField: "_id",
              foreignField: "itemId",
              as: "itemImages"
            }
          }, {
            $project: {
              _id: 0,
              totalQuantityOrdered: {
                kg: {
                  $floor: {
                    $divide: ["$totalQuantityOrderedGrams", 1000]
                  }
                },
                // Convert total grams to kg
                gram: {
                  $mod: ["$totalQuantityOrderedGrams", 1000]
                } // Calculate remaining grams

              },
              // Total quantity ordered in kg and grams
              itemDetails: {
                $arrayElemAt: ["$itemDetails", 0]
              },
              // Get the item details
              itemImages: {
                $arrayElemAt: ["$itemImages", 0]
              } // Get the item images

            }
          }]));

        case 6:
          orderData = _context7.sent;
          _context7.next = 9;
          return regeneratorRuntime.awrap(SubVendor.aggregate([{
            $match: {
              vendorId: vendorId,
              "assignedItems.itemId": {
                $in: orderData.map(function (order) {
                  return order.itemDetails._id;
                })
              }
            } // Match documents with the specified vendorId and matching assigned itemIds

          }, {
            $unwind: "$assignedItems" // Deconstruct the assignedItems array

          }, {
            $match: {
              "assignedItems.itemId": {
                $in: orderData.map(function (order) {
                  return order.itemDetails._id;
                })
              }
            } // Match assignedItems with the itemIds from orderData

          }, {
            $lookup: {
              from: "Items",
              localField: "assignedItems.itemId",
              foreignField: "_id",
              as: "itemDetails"
            }
          }, {
            $unwind: "$itemDetails" // Deconstruct the itemDetails array

          }, {
            $lookup: {
              from: "Category",
              localField: "itemDetails.categoryId",
              foreignField: "_id",
              as: "categoryInfo"
            }
          }, {
            $unwind: "$categoryInfo" // Deconstruct the categoryInfo array

          }, {
            $lookup: {
              from: "Images",
              localField: "itemDetails._id",
              foreignField: "itemId",
              as: "itemImages"
            }
          }, {
            $project: {
              _id: "$_id",
              vendorId: 1,
              subVendorPhone: "$phone",
              // Include the phone number of the subvendor
              itemId: "$assignedItems.itemId",
              itemName: "$itemDetails.name",
              itemDescription: "$itemDetails.description",
              category: "$categoryInfo.name",
              itemImages: "$itemImages.img"
            }
          }]));

        case 9:
          SubVendorsArray = _context7.sent;
          //   sendWhatsappmessge();
          res.json({
            success: true,
            SubVendorsArray: SubVendorsArray
          }); // Handle the fetched data as needed

          _context7.next = 16;
          break;

        case 13:
          _context7.prev = 13;
          _context7.t0 = _context7["catch"](0);
          next(_context7.t0);

        case 16:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 13]]);
});
var getHotelItemList = catchAsyncError(function _callee8(req, res, next) {
  var vendorId, HotelId, pipeline, itemList;
  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          vendorId = req.user._id;
          HotelId = req.body.HotelId;
          console.log(vendorId, HotelId);
          pipeline = [{
            $match: {
              vendorId: new ObjectId(vendorId),
              hotelId: new ObjectId(HotelId)
            }
          }, {
            $lookup: {
              from: "Items",
              localField: "itemId",
              foreignField: "_id",
              as: "items"
            }
          }, {
            $unwind: "$items"
          }, {
            $lookup: {
              from: "Images",
              localField: "itemId",
              foreignField: "itemId",
              as: "items.image"
            }
          }, {
            $unwind: "$items.image"
          }, {
            $lookup: {
              from: "Category",
              localField: "categoryId",
              foreignField: "_id",
              as: "items.category"
            }
          }, {
            $unwind: "$items.category"
          }]; // Fetch items associated with the vendor and hotelId, populating the associated item's fields

          _context8.next = 7;
          return regeneratorRuntime.awrap(HotelItemPrice.aggregate(pipeline));

        case 7:
          itemList = _context8.sent;
          return _context8.abrupt("return", res.json({
            itemList: itemList
          }));

        case 11:
          _context8.prev = 11;
          _context8.t0 = _context8["catch"](0);
          throw _context8.t0;

        case 14:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 11]]);
});
var getAllOrdersbyHotel = catchAsyncError(function _callee9(req, res, next) {
  var vendorId, HotelId, hotelOrders;
  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          vendorId = req.user._id;
          HotelId = req.body.HotelId;
          console.log(vendorId, HotelId);
          _context9.next = 6;
          return regeneratorRuntime.awrap(Orders.find({
            hotelId: HotelId,
            vendorId: vendorId
          }).populate("orderStatus"));

        case 6:
          hotelOrders = _context9.sent;
          // .populate("addressId");
          // .populate({
          //   path: "orderedItems.itemId",
          //   populate: { path: "itemId" }, // Populate the associated item details
          // });
          res.json({
            hotelOrders: hotelOrders
          });
          _context9.next = 13;
          break;

        case 10:
          _context9.prev = 10;
          _context9.t0 = _context9["catch"](0);
          next(_context9.t0);

        case 13:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
module.exports = {
  setHotelItemPrice: setHotelItemPrice,
  orderHistoryForVendors: orderHistoryForVendors,
  hotelsLinkedWithVendor: hotelsLinkedWithVendor,
  todayCompiledOrders: todayCompiledOrders,
  vendorItem: vendorItem,
  getAllSubVendors: getAllSubVendors,
  sendCompiledOrders: sendCompiledOrders,
  getHotelItemList: getHotelItemList,
  getAllOrdersbyHotel: getAllOrdersbyHotel
};