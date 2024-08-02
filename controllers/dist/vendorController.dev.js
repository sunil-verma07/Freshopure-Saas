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

var vendorStock = require("../models/vendorStock.js");

var puppeteer = require("puppeteer");

var UserOrder = require("../models/order.js");

var Items = require("../models/item");

var _require4 = require("mongoose"),
    isObjectIdOrHexString = _require4.isObjectIdOrHexString,
    trusted = _require4.trusted;

var vendorCategories = require("../models/vendorCategories.js");

var tf = require("@tensorflow/tfjs");

var item = require("../models/item");

var _require5 = require("../utils/messageToSubVendor.js"),
    messageToSubvendor = _require5.messageToSubvendor;

var image = require("../models/image.js");

var OrderStatus = require("../models/orderStatus.js");

var PaymentPlan = require("../models/paymentPlan.js");

var hotelItemPrice = require("../models/hotelItemPrice.js");

var _require6 = require("../utils/jwtToken.js"),
    generatePaymentToken = _require6.generatePaymentToken;

var setHotelItemPrice = catchAsyncError(function _callee(req, res, next) {
  var _req$body, itemId, hotelId, categoryId, price, vendorId, linkPresent, itemPresent, items;

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
          _context.next = 27;
          break;

        case 19:
          itemPresent.yesterdayCostPrice = itemPresent.todayCostPrice;
          itemPresent.todayCostPrice = price;
          _context.next = 23;
          return regeneratorRuntime.awrap(itemPresent.save());

        case 23:
          _context.next = 25;
          return regeneratorRuntime.awrap(getHotelItemsFunc(hotelId, vendorId));

        case 25:
          items = _context.sent;
          res.status(200).json({
            message: "Price updated successfully.",
            data: items
          });

        case 27:
          _context.next = 33;
          break;

        case 29:
          _context.prev = 29;
          _context.t0 = _context["catch"](0);
          console.log(_context.t0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 33:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 29]]);
});
var orderHistoryForVendors = catchAsyncError(function _callee2(req, res, next) {
  var vendorId, pageSize, _req$query, offset, status, statusId, orderData;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          vendorId = req.user._id;
          pageSize = 7;
          _req$query = req.query, offset = _req$query.offset, status = _req$query.status;
          _context2.next = 6;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: status
          }));

        case 6:
          statusId = _context2.sent;
          _context2.next = 9;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              vendorId: vendorId,
              orderStatus: new ObjectId(statusId._id)
            }
          }, {
            $lookup: {
              from: "Users",
              localField: "vendorId",
              foreignField: "_id",
              as: "vendorDetails"
            }
          }, {
            $unwind: "$vendorDetails"
          }, {
            $lookup: {
              from: "orderstatuses",
              localField: "orderStatus",
              foreignField: "_id",
              as: "orderStatusDetails"
            }
          }, {
            $unwind: "$orderStatusDetails"
          }, {
            $unwind: "$orderedItems"
          }, {
            $lookup: {
              from: "Items",
              localField: "orderedItems.itemId",
              foreignField: "_id",
              as: "itemDetails"
            }
          }, {
            $unwind: "$itemDetails"
          }, {
            $lookup: {
              from: "Images",
              localField: "itemDetails._id",
              foreignField: "itemId",
              as: "images"
            }
          }, {
            $unwind: "$images"
          }, {
            $group: {
              _id: {
                orderId: "$_id"
              },
              orderNumber: {
                $first: "$orderNumber"
              },
              isReviewed: {
                $first: "$isReviewed"
              },
              totalPrice: {
                $first: "$totalPrice"
              },
              address: {
                $first: "$address"
              },
              createdAt: {
                $first: "$createdAt"
              },
              updatedAt: {
                $first: "$updatedAt"
              },
              hotelId: {
                $first: "$hotelId"
              },
              vendorDetails: {
                $first: "$vendorDetails"
              },
              orderStatusDetails: {
                $first: "$orderStatusDetails"
              },
              orderedItems: {
                $push: {
                  $mergeObjects: ["$orderedItems", {
                    itemDetails: "$itemDetails"
                  }, {
                    image: "$images"
                  }]
                }
              }
            }
          }, {
            $project: {
              _id: 1,
              hotelId: 1,
              vendorDetails: 1,
              orderNumber: 1,
              isReviewed: 1,
              totalPrice: 1,
              address: 1,
              createdAt: 1,
              updatedAt: 1,
              orderStatusDetails: 1,
              orderedItems: 1
            }
          }, {
            $skip: parseInt(offset)
          }, {
            $limit: pageSize
          }]));

        case 9:
          orderData = _context2.sent;
          // console.log(
          //   "data:" + orderData.length,
          //   "offset:" + offset,
          //   "page size: " + pageSize
          // );
          // orderData.map((order) => {
          //   console.log(order.orderNumber);
          // });
          res.status(200).json({
            status: "success",
            data: orderData
          });
          _context2.next = 16;
          break;

        case 13:
          _context2.prev = 13;
          _context2.t0 = _context2["catch"](0);
          next(_context2.t0);

        case 16:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 13]]);
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
  var vendorId, today, status, orderData, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, order, subVendor, subVendorCode;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          vendorId = req.user._id;
          today = new Date(); // Assuming you have today's date

          today.setHours(0, 0, 0, 0); // Set time to the start of the day

          _context4.prev = 3;
          _context4.next = 6;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: "Cancelled"
          }));

        case 6:
          status = _context4.sent;
          _context4.next = 9;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              vendorId: vendorId,
              createdAt: {
                $gte: today
              },
              // Filter orders for today
              orderStatus: {
                $ne: status._id
              }
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
            $unwind: "$orderedItems" // Unwind orderedItems array

          }, {
            $group: {
              _id: "$orderedItems.itemId",
              totalQuantityOrderedGrams: {
                $sum: {
                  $add: [{
                    $multiply: ["$orderedItems.quantity.kg", 1000]
                  }, // Convert kg to grams
                  "$orderedItems.quantity.gram" // Add grams
                  ]
                }
              },
              // Total quantity ordered in grams
              itemDetails: {
                $first: "$orderedItems"
              },
              // Take item details from the first document
              hotelOrders: {
                $push: "$$ROOT"
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
            $unwind: "$itemDetails"
          }, {
            $lookup: {
              from: "Images",
              localField: "_id",
              foreignField: "itemId",
              as: "itemImages"
            }
          }, {
            $unwind: "$itemImages"
          } // {
          //   $project: {
          //     _id: 0,
          //     totalQuantityOrdered: {
          //       kg: { $floor: { $divide: ["$totalQuantityOrderedGrams", 1000] } }, // Convert total grams to kg
          //       gram: { $mod: ["$totalQuantityOrderedGrams", 1000] }, // Calculate remaining grams
          //     }, // Total quantity ordered in kg and grams
          //     itemDetails: { $arrayElemAt: ["$itemDetails", 0] }, // Get the item details
          //     itemImages: { $arrayElemAt: ["$itemImages", 0] }, // Get the item images
          //     hotelDetails: { $arrayElemAt: ["$hotelDetails", 0] },
          //   },
          // },
          ]));

        case 9:
          orderData = _context4.sent;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context4.prev = 13;
          _iterator = orderData[Symbol.iterator]();

        case 15:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context4.next = 24;
            break;
          }

          order = _step.value;
          _context4.next = 19;
          return regeneratorRuntime.awrap(SubVendor.findOne({
            vendorId: vendorId,
            // Match the vendorId
            assignedItems: {
              $elemMatch: {
                itemId: order.itemDetails._id
              }
            } // Match the itemId within assignedItems array

          }));

        case 19:
          subVendor = _context4.sent;

          if (subVendor) {
            subVendorCode = subVendor.subVendorCode;
            order.itemDetails["subVendorCode"] = subVendorCode;
          } else {
            order.itemDetails["subVendorCode"] = "Not Assigned.";
          }

        case 21:
          _iteratorNormalCompletion = true;
          _context4.next = 15;
          break;

        case 24:
          _context4.next = 30;
          break;

        case 26:
          _context4.prev = 26;
          _context4.t0 = _context4["catch"](13);
          _didIteratorError = true;
          _iteratorError = _context4.t0;

        case 30:
          _context4.prev = 30;
          _context4.prev = 31;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 33:
          _context4.prev = 33;

          if (!_didIteratorError) {
            _context4.next = 36;
            break;
          }

          throw _iteratorError;

        case 36:
          return _context4.finish(33);

        case 37:
          return _context4.finish(30);

        case 38:
          // console.log(orderData, "od");
          res.status(200).json({
            status: "success",
            data: orderData
          });
          _context4.next = 44;
          break;

        case 41:
          _context4.prev = 41;
          _context4.t1 = _context4["catch"](3);
          next(_context4.t1);

        case 44:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[3, 41], [13, 26, 30, 38], [31,, 33, 37]]);
});
var vendorItem = catchAsyncErrors(function _callee5(req, res, next) {
  var vendorId, AllItems, AssignedItems, assignedItemsArray, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _item, _Items;

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
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context5.prev = 12;

          for (_iterator2 = AssignedItems[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            _item = _step2.value;
            assignedItemsArray.push.apply(assignedItemsArray, _toConsumableArray(_item.assignedItems));
          }

          _context5.next = 20;
          break;

        case 16:
          _context5.prev = 16;
          _context5.t0 = _context5["catch"](12);
          _didIteratorError2 = true;
          _iteratorError2 = _context5.t0;

        case 20:
          _context5.prev = 20;
          _context5.prev = 21;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 23:
          _context5.prev = 23;

          if (!_didIteratorError2) {
            _context5.next = 26;
            break;
          }

          throw _iteratorError2;

        case 26:
          return _context5.finish(23);

        case 27:
          return _context5.finish(20);

        case 28:
          _Items = AllItems.filter(function (obj1) {
            return !assignedItemsArray.some(function (obj2) {
              return obj1.itemId.equals(obj2.itemId);
            });
          });
          res.status(200).json({
            success: true,
            Items: _Items
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
          console.log(vendorId, HotelId, "yes");
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
            data: itemList
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
  var vendorId, HotelId, orderData;
  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          vendorId = req.user._id;
          HotelId = req.body.HotelId;
          _context9.next = 5;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              vendorId: vendorId,
              hotelId: new ObjectId(HotelId)
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
              from: "orderstatuses",
              localField: "orderStatus",
              foreignField: "_id",
              as: "orderStatusDetails"
            }
          }, {
            $unwind: "$orderStatusDetails"
          }, {
            $lookup: {
              from: "Items",
              localField: "orderedItems.itemId",
              foreignField: "_id",
              as: "itemDetails"
            }
          }, {
            $unwind: "$itemDetails"
          }, {
            $lookup: {
              from: "Images",
              localField: "itemDetails._id",
              foreignField: "itemId",
              as: "images"
            }
          }, {
            $unwind: "$images"
          }, {
            $group: {
              _id: {
                orderId: "$_id"
              },
              orderNumber: {
                $first: "$orderNumber"
              },
              isReviewed: {
                $first: "$isReviewed"
              },
              totalPrice: {
                $first: "$totalPrice"
              },
              address: {
                $first: "$address"
              },
              createdAt: {
                $first: "$createdAt"
              },
              updatedAt: {
                $first: "$updatedAt"
              },
              hotelId: {
                $first: "$hotelId"
              },
              vendorDetails: {
                $first: "$hotelDetails"
              },
              orderStatusDetails: {
                $first: "$orderStatusDetails"
              },
              orderedItems: {
                $push: {
                  itemId: "$orderedItems.itemId",
                  price: "$orderedItems.price",
                  quantity: "$orderedItems.quantity",
                  _id: "$orderedItems._id",
                  itemDetails: "$itemDetails",
                  image: "$images"
                }
              }
            }
          }, {
            $project: {
              _id: 1,
              orderNumber: 1,
              isReviewed: 1,
              totalPrice: 1,
              address: 1,
              createdAt: 1,
              updatedAt: 1,
              hotelId: 1,
              vendorDetails: 1,
              orderStatusDetails: 1,
              orderedItems: 1
            }
          }]));

        case 5:
          orderData = _context9.sent;
          // console.log(orderData, "orderrrr");
          res.json({
            hotelOrders: orderData
          });
          _context9.next = 12;
          break;

        case 9:
          _context9.prev = 9;
          _context9.t0 = _context9["catch"](0);
          next(_context9.t0);

        case 12:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
var updateStock = catchAsyncError(function _callee10(req, res, next) {
  var _req$body2, itemId, quantity, vendorId, _item2, stocks, vendorStocks;

  return regeneratorRuntime.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          _req$body2 = req.body, itemId = _req$body2.itemId, quantity = _req$body2.quantity;
          vendorId = req.user._id;

          if (!(!itemId || !quantity)) {
            _context10.next = 5;
            break;
          }

          return _context10.abrupt("return", res.status(400).json({
            message: "All the fields are required!"
          }));

        case 5:
          _context10.next = 7;
          return regeneratorRuntime.awrap(vendorStock.findOne({
            vendorId: vendorId
          }));

        case 7:
          _item2 = _context10.sent;

          if (!_item2) {
            // Create a new stock entry if it doesn't exist
            _item2 = new vendorStock({
              vendorId: vendorId,
              stocks: [{
                itemId: itemId,
                quantity: {
                  kg: 0,
                  gram: 0,
                  piece: 0
                }
              }]
            });
          } // Update the quantity of the item in the stock


          stocks = _item2.stocks.map(function (stock) {
            if (stock.itemId.toString() === itemId) {
              return {
                itemId: itemId,
                quantity: {
                  kg: quantity.kg || stock.quantity.kg,
                  gram: quantity.gram || stock.quantity.gram,
                  piece: quantity.piece || stock.quantity.piece
                }
              };
            }

            return stock;
          });
          _item2.stocks = stocks;
          _context10.next = 13;
          return regeneratorRuntime.awrap(_item2.save());

        case 13:
          _context10.next = 15;
          return regeneratorRuntime.awrap(getVendorStockFunc(vendorId));

        case 15:
          vendorStocks = _context10.sent;

          if (vendorStocks.length > 0) {
            res.json({
              message: "Stock updated successfully",
              data: vendorStocks[0]
            });
          }

          _context10.next = 22;
          break;

        case 19:
          _context10.prev = 19;
          _context10.t0 = _context10["catch"](0);
          next(_context10.t0);

        case 22:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[0, 19]]);
});
var generateInvoice = catchAsyncError(function _callee11(req, res, next) {
  var orderId, orderData, data, styles, date, totalPrice, generateInlineStyles, html, browser, page, pdfBuffer;
  return regeneratorRuntime.async(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          orderId = req.body.orderId;
          console.log(orderId);
          _context11.next = 4;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              _id: new ObjectId(orderId)
            }
          }, {
            $lookup: {
              from: "orderstatuses",
              localField: "orderStatus",
              foreignField: "_id",
              as: "orderStatus"
            }
          }, {
            $unwind: "$orderStatus"
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
              from: "Users",
              localField: "vendorId",
              foreignField: "_id",
              as: "vendorDetails"
            }
          }, {
            $unwind: "$vendorDetails"
          }, // {
          //   $unwind: "$orderedItems" // Unwind the orderedItems array
          // },
          {
            $lookup: {
              from: "Items",
              // Target collection
              localField: "orderedItems.itemId",
              // Field from the input collection
              foreignField: "_id",
              // Field from the target collection
              as: "itemDetails" // Output array field

            }
          }, {
            $addFields: {
              "orderedItems.itemDetails": {
                $arrayElemAt: ["$itemDetails", 0]
              } // Add itemDetails to orderedItems

            }
          }, {
            $lookup: {
              from: "Category",
              // Target collection
              localField: "orderedItems.itemDetails.categoryId",
              // Field from the input collection
              foreignField: "_id",
              // Field from the target collection
              as: "categoryDetails" // Output array field

            }
          }, {
            $addFields: {
              "orderedItems.itemDetails.category": {
                $arrayElemAt: ["$categoryDetails", 0]
              } // Add categoryDetails to itemDetails

            }
          }]));

        case 4:
          orderData = _context11.sent;
          data = orderData[0];
          styles = {
            container: {
              fontFamily: "Arial, sans-serif",
              marginBottom: "30px",
              width: "520px",
              margin: "auto",
              paddingRight: "10px",
              borderRadius: "8px",
              background: "#fff"
            },
            header: {
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "5px"
            },
            logo: {
              maxWidth: "50px",
              maxHeight: "50px"
            },
            table: {
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "10px"
            },
            th: {
              border: "1px solid #ddd",
              padding: "4px",
              textAlign: "left",
              background: "#f2f2f2",
              fontSize: "10px"
            },
            td: {
              border: "1px solid #ddd",
              padding: "4px",
              fontSize: "8px"
            },
            total: {
              textAlign: "right",
              fontSize: "12px",
              fontWeight: "600"
            }
          };

          date = function date(createdOnString) {
            // Assuming createdOn is a date string or a Date object
            var createdOn = new Date(createdOnString); // Replace this with your actual date

            var options = {
              year: "numeric",
              month: "short",
              day: "numeric" // Use 24-hour format

            };
            var formattedDateTime = new Intl.DateTimeFormat("en-US", options).format(createdOn);
            return "".concat(formattedDateTime);
          };

          totalPrice = function totalPrice(items) {
            var totalPrice = 0;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = items[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _item3 = _step3.value;
                totalPrice = totalPrice + (_item3.price * _item3.quantity.kg + _item3.price * (_item3.quantity.gram / 1000));
              }
            } catch (err) {
              _didIteratorError3 = true;
              _iteratorError3 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
                  _iterator3["return"]();
                }
              } finally {
                if (_didIteratorError3) {
                  throw _iteratorError3;
                }
              }
            }

            return totalPrice;
          };

          generateInlineStyles = function generateInlineStyles(styles) {
            return Object.keys(styles).map(function (key) {
              return "".concat(key, ":").concat(styles[key]);
            }).join(";");
          };

          html = "\n    <div style=\"".concat(generateInlineStyles(styles.container), "\">\n      <div style=\"").concat(generateInlineStyles(styles.header), "\">\n        \n        <!-- <img src={Logo} alt=\"Logo\" style=").concat(generateInlineStyles(styles.logo), " /> -->\n        <div>\n          <h1 style=\"font-weight:600;font-size:24px;\">INVOICE</h1>\n        </div>\n      </div>\n      <div style=\"display:flex;justify-content:space-between\">\n        <p style=\"line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;\">Hello, ").concat(data.hotelDetails.fullName, ".<br/>Thank you for shopping from ").concat(data.vendorDetails.fullName, ".</p>\n        <p style=\"line-height:1.4em;font-size:12px;margin-top:10px;margin-bottom:20px;text-align:right\">Order #").concat(data.orderNumber, " <br/> </p>\n      </div>\n      <div style=\"display:flex;margin-bottom:10px\">\n        <div style=\"border:1px solid #ddd ;flex:1;margin-right:5px;padding:10px\">\n          <p style=\"font-weight:600;font-size:12px;\">").concat(data.vendorDetails.fullName, "</p>\n          <p style=\"line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px\">\n          Rajasthan\n          302017\n          </p>\n          <p style=\"line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px\">\n          GSTIN/UIN: 08ABFCS1307P1Z2\n          </p> \n          \n          <p style=\"line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px\">\n          State Name : Rajasthan, Code : 08\n          \n          </p>\n        </div>\n        <div style=\"border:1px solid #ddd ;flex:1;margin-left:5px;padding:10px\">\n          <p style=\"font-weight:600;font-size:12px;\">").concat(data.hotelDetails.fullName, "</p>\n          <p style=\"line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px\">\n          ").concat(data.address.addressLine1, ",").concat(data.address.addressLine2, ",").concat(data.address.city, "\n          ,").concat(data.address.pinCode, " \n          </p>\n          \n          \n          <p style=\"line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:1px\">\n          State Name : ").concat(data.address.state, ", Code : 08\n          </p>\n        </div>\n      </div>\n      <table style=\"").concat(generateInlineStyles(styles.table), "\">\n        <thead>\n          <tr>\n            <th style=\"").concat(generateInlineStyles(styles.th), "\">Item Name</th>\n            <th style=\"").concat(generateInlineStyles(styles.th), "\">Category</th>\n            <th style=\"").concat(generateInlineStyles(styles.th), "\">Quantity</th>\n            <th style=\"").concat(generateInlineStyles(styles.th), "\">Unit Price</th>\n            <th style=\"").concat(generateInlineStyles(styles.th), "\">Price</th>\n          </tr>\n        </thead>\n        <tbody>\n          ").concat(data.orderedItems.map(function (item, index) {
            return "\n            <tr key=".concat(index, ">\n              <td style=\"").concat(generateInlineStyles(styles.td), "\">").concat(item.itemDetails.name, "</td>\n              <td style=\"").concat(generateInlineStyles(styles.td), "\">").concat(item.itemDetails.category.name, "</td>\n              <td style=\"").concat(generateInlineStyles(styles.td), "\">").concat(item.quantity.kg, " Kg   ").concat(item.quantity.gram, " Grams</td>\n              <td style=\"").concat(generateInlineStyles(styles.td), "\">").concat(item.price, "</td>\n              <td style=\"").concat(generateInlineStyles(styles.td), "\">").concat(item.price * item.quantity.kg + item.price * (item.quantity.gram / 1000), "</td>\n            </tr>\n          ");
          }).join(""), "\n        </tbody>\n      </table>\n      <div style=\"").concat(generateInlineStyles(styles.total), "\">\n        <p>Total:\u20B9").concat(totalPrice(data.orderedItems), "</p>\n      </div>\n      <div style=\"display:flex;margin-bottom:10px;margin-top:20px\">\n        <div style=\"flex:1;margin-right:5px\">\n          <p style=\"font-weight:600;font-size:10px;\">Declaration</p>\n          <p style=\"line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:10px\">\n          We declare that this invoice shows the actual price of the \n          goods described and that all particulars are true and \n          correct\n          </p>\n         \n        </div>\n        <div style=\"flex:1;margin-right:5px;text-align:right\">\n          <p style=\"font-weight:600;font-size:10px;\">for Shvaas Sustainable Solutions Private Limited</p>\n          \n          <p style=\"line-height:1.4em;font-size:10px;color:#7a7a7a;margin-top:30px;text-align:right\">\n          Authorised Signatory\n          </p>\n        </div>\n      </div>\n    </div>\n  ");
          _context11.prev = 11;
          _context11.next = 14;
          return regeneratorRuntime.awrap(puppeteer.launch());

        case 14:
          browser = _context11.sent;
          _context11.next = 17;
          return regeneratorRuntime.awrap(browser.newPage());

        case 17:
          page = _context11.sent;
          _context11.next = 20;
          return regeneratorRuntime.awrap(page.setContent(html));

        case 20:
          _context11.next = 22;
          return regeneratorRuntime.awrap(page.pdf({
            format: "A4"
          }));

        case 22:
          pdfBuffer = _context11.sent;
          // Set response headers for PDF download
          res.setHeader("Content-Disposition", 'attachment; filename="generated.pdf"');
          res.setHeader("Content-Type", "application/pdf"); // Send the PDF as a stream in the response

          res.send(pdfBuffer); // Close the Puppeteer browser

          _context11.next = 28;
          return regeneratorRuntime.awrap(browser.close());

        case 28:
          _context11.next = 34;
          break;

        case 30:
          _context11.prev = 30;
          _context11.t0 = _context11["catch"](11);
          console.error("Error creating PDF:", _context11.t0);
          res.status(500).send("Error creating PDF", _context11.t0);

        case 34:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[11, 30]]);
});
var addItemToStock = catchAsyncError(function _callee12(req, res, next) {
  var itemId, vendorId, stock, itemExists, vendorStocks;
  return regeneratorRuntime.async(function _callee12$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          _context12.prev = 0;
          itemId = req.body.itemId;
          vendorId = req.user._id;

          if (itemId) {
            _context12.next = 5;
            break;
          }

          return _context12.abrupt("return", res.status(400).json({
            message: "itemId is required!"
          }));

        case 5:
          _context12.next = 7;
          return regeneratorRuntime.awrap(vendorStock.findOne({
            vendorId: vendorId
          }));

        case 7:
          stock = _context12.sent;

          if (!stock) {
            _context12.next = 17;
            break;
          }

          itemExists = stock.stocks.some(function (item) {
            return item.itemId.toString() === itemId;
          });

          if (!itemExists) {
            _context12.next = 12;
            break;
          }

          return _context12.abrupt("return", res.status(400).json({
            message: "Item already exists in the stock"
          }));

        case 12:
          // Add the new item to the stock
          stock.stocks.push({
            itemId: itemId,
            quantity: {
              kg: 0,
              gram: 0,
              piece: 0
            }
          });
          _context12.next = 15;
          return regeneratorRuntime.awrap(stock.save());

        case 15:
          _context12.next = 19;
          break;

        case 17:
          _context12.next = 19;
          return regeneratorRuntime.awrap(vendorStock.create({
            vendorId: vendorId,
            stocks: [{
              itemId: itemId,
              quantity: {
                kg: 0,
                gram: 0,
                piece: 0
              }
            }]
          }));

        case 19:
          _context12.next = 21;
          return regeneratorRuntime.awrap(getVendorStockFunc(vendorId));

        case 21:
          vendorStocks = _context12.sent;

          if (vendorStocks.length > 0) {
            res.json({
              message: "Stock added successfully",
              data: vendorStocks[0].stocks
            });
          }

          _context12.next = 28;
          break;

        case 25:
          _context12.prev = 25;
          _context12.t0 = _context12["catch"](0);
          next(_context12.t0);

        case 28:
        case "end":
          return _context12.stop();
      }
    }
  }, null, null, [[0, 25]]);
});
var getVendorStocks = catchAsyncError(function _callee13(req, res, next) {
  var vendorId, stocks;
  return regeneratorRuntime.async(function _callee13$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          _context13.prev = 0;
          vendorId = req.user._id; // Assuming req.user._id contains the vendorId
          // Aggregate pipeline to fetch vendor stocks with item details and images

          _context13.next = 4;
          return regeneratorRuntime.awrap(vendorStock.aggregate([{
            $match: {
              vendorId: new ObjectId(vendorId)
            }
          }, {
            $unwind: "$stocks"
          }, {
            $lookup: {
              from: "Items",
              localField: "stocks.itemId",
              foreignField: "_id",
              as: "itemDetails"
            }
          }, {
            $unwind: "$itemDetails"
          }, {
            $lookup: {
              from: "Images",
              localField: "stocks.itemId",
              foreignField: "itemId",
              as: "images"
            }
          }, {
            $unwind: "$images"
          }, {
            $addFields: {
              "stocks.itemDetails": "$itemDetails",
              "stocks.images": "$images"
            }
          }, {
            $group: {
              _id: "$_id",
              vendorId: {
                $first: "$vendorId"
              },
              stocks: {
                $push: "$stocks"
              }
            }
          }]));

        case 4:
          stocks = _context13.sent;

          if (!(stocks.length > 0)) {
            _context13.next = 9;
            break;
          }

          return _context13.abrupt("return", res.json({
            data: stocks[0]
          }));

        case 9:
          return _context13.abrupt("return", res.status(404).json({
            message: "Vendor stock not found!"
          }));

        case 10:
          _context13.next = 15;
          break;

        case 12:
          _context13.prev = 12;
          _context13.t0 = _context13["catch"](0);
          next(_context13.t0);

        case 15:
        case "end":
          return _context13.stop();
      }
    }
  }, null, null, [[0, 12]]);
});
var deleteItemFromStock = catchAsyncError(function _callee14(req, res, next) {
  var itemId, vendorId, stock, itemIndex, vendorStocks;
  return regeneratorRuntime.async(function _callee14$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          _context14.prev = 0;
          // Extract necessary parameters from the request
          itemId = req.body.itemId;
          vendorId = req.user._id; // Query the database to find the item in the stock

          _context14.next = 5;
          return regeneratorRuntime.awrap(vendorStock.findOne({
            vendorId: vendorId
          }));

        case 5:
          stock = _context14.sent;

          if (stock) {
            _context14.next = 8;
            break;
          }

          return _context14.abrupt("return", res.status(404).json({
            message: "Stock not found for the vendor."
          }));

        case 8:
          // Find the index of the item to be deleted
          itemIndex = stock.stocks.findIndex(function (item) {
            return item.itemId.toString() === itemId;
          }); // console.log(itemIndex, "itemIndex");

          if (!(itemIndex === -1)) {
            _context14.next = 11;
            break;
          }

          return _context14.abrupt("return", res.status(404).json({
            message: "Item not found in the stock."
          }));

        case 11:
          // Remove the item from the stock
          stock.stocks.splice(itemIndex, 1); // Save the changes to the database

          _context14.next = 14;
          return regeneratorRuntime.awrap(stock.save());

        case 14:
          _context14.next = 16;
          return regeneratorRuntime.awrap(getVendorStockFunc(vendorId));

        case 16:
          vendorStocks = _context14.sent;
          console.log(vendorStocks, "stocksss");

          if (vendorStocks.length > 0) {
            res.json({
              message: "Stock deleted successfully",
              data: vendorStocks[0].stocks
            });
          }

          _context14.next = 25;
          break;

        case 21:
          _context14.prev = 21;
          _context14.t0 = _context14["catch"](0);
          console.log(_context14.t0, "err");
          next(_context14.t0);

        case 25:
        case "end":
          return _context14.stop();
      }
    }
  }, null, null, [[0, 21]]);
});
var deleteHotelItem = catchAsyncError(function _callee15(req, res, next) {
  var _req$body3, hotelId, itemId, vendorId, _item4, itemList;

  return regeneratorRuntime.async(function _callee15$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
        case 0:
          _context15.prev = 0;
          _req$body3 = req.body, hotelId = _req$body3.hotelId, itemId = _req$body3.itemId;
          vendorId = req.user._id; // Check if vendorId, hotelId, and itemId are provided

          if (!(!vendorId || !hotelId || !itemId)) {
            _context15.next = 5;
            break;
          }

          return _context15.abrupt("return", res.status(400).json({
            message: "vendorId, hotelId, and itemId are required!"
          }));

        case 5:
          _context15.next = 7;
          return regeneratorRuntime.awrap(HotelItemPrice.findOne({
            vendorId: new ObjectId(vendorId),
            hotelId: new ObjectId(hotelId),
            itemId: new ObjectId(itemId)
          }));

        case 7:
          _item4 = _context15.sent;

          if (_item4) {
            _context15.next = 10;
            break;
          }

          return _context15.abrupt("return", res.json({
            message: "Item Not Found"
          }));

        case 10:
          _context15.next = 12;
          return regeneratorRuntime.awrap(HotelItemPrice.deleteOne({
            _id: _item4._id
          }));

        case 12:
          _context15.next = 14;
          return regeneratorRuntime.awrap(getHotelItemsFunc(hotelId, vendorId));

        case 14:
          itemList = _context15.sent;
          // Send success response
          res.json({
            message: "Document deleted successfully",
            data: itemList
          });
          _context15.next = 21;
          break;

        case 18:
          _context15.prev = 18;
          _context15.t0 = _context15["catch"](0);
          // Pass any errors to the error handling middleware
          next(_context15.t0);

        case 21:
        case "end":
          return _context15.stop();
      }
    }
  }, null, null, [[0, 18]]);
});
var addHotelItem = catchAsyncError(function _callee16(req, res, next) {
  var _req$body4, hotelId, itemIds, vendorId, items, hotelItems, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _loop, _iterator4, _step4, _ret, itemList;

  return regeneratorRuntime.async(function _callee16$(_context17) {
    while (1) {
      switch (_context17.prev = _context17.next) {
        case 0:
          _context17.prev = 0;
          _req$body4 = req.body, hotelId = _req$body4.hotelId, itemIds = _req$body4.itemIds;
          vendorId = req.user._id; // Validate required fields

          if (!(!vendorId || !hotelId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0)) {
            _context17.next = 5;
            break;
          }

          return _context17.abrupt("return", res.status(400).json({
            message: "vendorId, hotelId, and itemIds are required fields and must be provided as a non-empty array."
          }));

        case 5:
          _context17.next = 7;
          return regeneratorRuntime.awrap(VendorItems.findOne({
            vendorId: vendorId
          }).select("items"));

        case 7:
          items = _context17.sent;
          console.log(items, "items");
          hotelItems = [];
          _iteratorNormalCompletion4 = true;
          _didIteratorError4 = false;
          _iteratorError4 = undefined;
          _context17.prev = 13;

          _loop = function _loop() {
            var itemId, item, category, hotelItemPrice;
            return regeneratorRuntime.async(function _loop$(_context16) {
              while (1) {
                switch (_context16.prev = _context16.next) {
                  case 0:
                    itemId = _step4.value;
                    item = items.items.find(function (item) {
                      return item.itemId.equals(itemId);
                    });

                    if (item) {
                      _context16.next = 4;
                      break;
                    }

                    return _context16.abrupt("return", "continue");

                  case 4:
                    _context16.next = 6;
                    return regeneratorRuntime.awrap(Items.findOne({
                      _id: itemId
                    }));

                  case 6:
                    category = _context16.sent;
                    console.log(category, "category"); // Create new HotelItemPrice document

                    hotelItemPrice = new HotelItemPrice({
                      vendorId: vendorId,
                      hotelId: hotelId,
                      itemId: itemId,
                      categoryId: category.categoryId,
                      todayCostPrice: item.todayCostPrice,
                      todayPercentageProfit: 0,
                      showPrice: true // Default to true if not provided

                    }); // Save the new document to the database

                    console.log(hotelItemPrice, "hotelItem");
                    _context16.next = 12;
                    return regeneratorRuntime.awrap(hotelItemPrice.save());

                  case 12:
                    hotelItems.push(hotelItemPrice);

                  case 13:
                  case "end":
                    return _context16.stop();
                }
              }
            });
          };

          _iterator4 = itemIds[Symbol.iterator]();

        case 16:
          if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
            _context17.next = 25;
            break;
          }

          _context17.next = 19;
          return regeneratorRuntime.awrap(_loop());

        case 19:
          _ret = _context17.sent;

          if (!(_ret === "continue")) {
            _context17.next = 22;
            break;
          }

          return _context17.abrupt("continue", 22);

        case 22:
          _iteratorNormalCompletion4 = true;
          _context17.next = 16;
          break;

        case 25:
          _context17.next = 31;
          break;

        case 27:
          _context17.prev = 27;
          _context17.t0 = _context17["catch"](13);
          _didIteratorError4 = true;
          _iteratorError4 = _context17.t0;

        case 31:
          _context17.prev = 31;
          _context17.prev = 32;

          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }

        case 34:
          _context17.prev = 34;

          if (!_didIteratorError4) {
            _context17.next = 37;
            break;
          }

          throw _iteratorError4;

        case 37:
          return _context17.finish(34);

        case 38:
          return _context17.finish(31);

        case 39:
          _context17.next = 41;
          return regeneratorRuntime.awrap(getHotelItemsFunc({
            HotelId: hotelId,
            vendorId: vendorId
          }));

        case 41:
          itemList = _context17.sent;
          // Send success response
          res.json({
            message: "Documents added successfully",
            data: itemList
          }); // const category = new ObjectId("65c093bb6b33fbcf67fb2784");
          // const items = await item.updateMany(
          //   { categoryId: category },
          //   { $set: { categoryId: new ObjectId("65cc61c193a94ee59d679497") } }
          // );
          // return res.json({ Message: "done", items });

          _context17.next = 49;
          break;

        case 45:
          _context17.prev = 45;
          _context17.t1 = _context17["catch"](0);
          // Pass any errors to the error handling middleware
          console.log(_context17.t1, "err");
          next(_context17.t1);

        case 49:
        case "end":
          return _context17.stop();
      }
    }
  }, null, null, [[0, 45], [13, 27, 31, 39], [32,, 34, 38]]);
});
var getHotelAssignableItems = catchAsyncError(function _callee17(req, res, next) {
  var _hotelId, _vendorId, allItemsIds, _items, _hotelItems, assignedItemIds, notAssignedItemIds, assignItems, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, _item5, newItem, itemDetails;

  return regeneratorRuntime.async(function _callee17$(_context18) {
    while (1) {
      switch (_context18.prev = _context18.next) {
        case 0:
          _context18.prev = 0;
          _hotelId = req.body.hotelId;
          _vendorId = req.user._id;

          if (_hotelId) {
            _context18.next = 5;
            break;
          }

          return _context18.abrupt("return", res.status(400).json({
            message: " Hotel ID not provided"
          }));

        case 5:
          allItemsIds = [];
          _context18.next = 8;
          return regeneratorRuntime.awrap(VendorItems.findOne({
            vendorId: _vendorId
          }).select("items"));

        case 8:
          _items = _context18.sent;

          _items.items.map(function (item) {
            if (item.todayCostPrice !== 0) {
              allItemsIds.push(item.itemId);
            }
          }); // console.log(allItemsIds, "all");


          _context18.next = 12;
          return regeneratorRuntime.awrap(HotelItemPrice.find({
            vendorId: new ObjectId(_vendorId),
            hotelId: new ObjectId(_hotelId)
          }).select("itemId"));

        case 12:
          _hotelItems = _context18.sent;
          assignedItemIds = _hotelItems.map(function (item) {
            return item.itemId.toString();
          }); // Filter out items from allItemsIds that are not present in assignedItemIds

          notAssignedItemIds = allItemsIds.filter(function (item) {
            return item._id && !assignedItemIds.includes(item._id.toString());
          });
          console.log(_hotelItems);
          assignItems = []; // Retrieve item details for not assigned items

          _iteratorNormalCompletion5 = true;
          _didIteratorError5 = false;
          _iteratorError5 = undefined;
          _context18.prev = 20;
          _iterator5 = notAssignedItemIds[Symbol.iterator]();

        case 22:
          if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
            _context18.next = 33;
            break;
          }

          _item5 = _step5.value;
          newItem = {
            itemDetails: null
          };
          _context18.next = 27;
          return regeneratorRuntime.awrap(Items.findOne({
            _id: new ObjectId(_item5._id)
          }));

        case 27:
          itemDetails = _context18.sent;
          newItem.itemDetails = itemDetails;
          assignItems.push(newItem);

        case 30:
          _iteratorNormalCompletion5 = true;
          _context18.next = 22;
          break;

        case 33:
          _context18.next = 39;
          break;

        case 35:
          _context18.prev = 35;
          _context18.t0 = _context18["catch"](20);
          _didIteratorError5 = true;
          _iteratorError5 = _context18.t0;

        case 39:
          _context18.prev = 39;
          _context18.prev = 40;

          if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
            _iterator5["return"]();
          }

        case 42:
          _context18.prev = 42;

          if (!_didIteratorError5) {
            _context18.next = 45;
            break;
          }

          throw _iteratorError5;

        case 45:
          return _context18.finish(42);

        case 46:
          return _context18.finish(39);

        case 47:
          res.status(200).json({
            assignItems: assignItems,
            message: "filtered"
          });
          _context18.next = 54;
          break;

        case 50:
          _context18.prev = 50;
          _context18.t1 = _context18["catch"](0);
          console.error(_context18.t1);
          res.status(500).json({
            success: false,
            error: "Internal server error"
          });

        case 54:
        case "end":
          return _context18.stop();
      }
    }
  }, null, null, [[0, 50], [20, 35, 39, 47], [40,, 42, 46]]);
});
var addStockItemOptions = catchAsyncError(function _callee18(req, res, next) {
  var _vendorId2, vendor, vendorItems, allItemsIds, _item6, assignedItemIds, notAssignedItemIds, assignItems, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, _item7, newItem, itemDetails;

  return regeneratorRuntime.async(function _callee18$(_context19) {
    while (1) {
      switch (_context19.prev = _context19.next) {
        case 0:
          _context19.prev = 0;
          _vendorId2 = req.user._id;
          _context19.next = 4;
          return regeneratorRuntime.awrap(VendorItems.findOne({
            vendorId: new ObjectId(_vendorId2)
          }).select("items"));

        case 4:
          vendor = _context19.sent;
          vendorItems = [];
          vendor.items.forEach(function (item) {
            console.log(item, "item");
            vendorItems.push(item.itemId);
          });
          allItemsIds = vendorItems.map(function (item) {
            return item.toString();
          });
          _context19.next = 10;
          return regeneratorRuntime.awrap(vendorStock.findOne({
            vendorId: _vendorId2
          }));

        case 10:
          _item6 = _context19.sent;
          // Update the quantity of the item in the stock
          assignedItemIds = [];

          _item6.stocks.map(function (stock) {
            assignedItemIds.push(stock.itemId.toString());
          }); // Filter out items from allItemsIds that are not present in assignedItemIds


          notAssignedItemIds = allItemsIds.filter(function (item) {
            return item && !assignedItemIds.includes(item.toString());
          }); // console.log(allItemsIds, assignedItemIds, notAssignedItemIds);

          assignItems = []; // Retrieve item details for not assigned items

          _iteratorNormalCompletion6 = true;
          _didIteratorError6 = false;
          _iteratorError6 = undefined;
          _context19.prev = 18;
          _iterator6 = notAssignedItemIds[Symbol.iterator]();

        case 20:
          if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
            _context19.next = 31;
            break;
          }

          _item7 = _step6.value;
          newItem = {
            itemDetails: null
          };
          _context19.next = 25;
          return regeneratorRuntime.awrap(Items.findOne({
            _id: new ObjectId(_item7)
          }));

        case 25:
          itemDetails = _context19.sent;
          newItem.itemDetails = itemDetails;
          assignItems.push(newItem);

        case 28:
          _iteratorNormalCompletion6 = true;
          _context19.next = 20;
          break;

        case 31:
          _context19.next = 37;
          break;

        case 33:
          _context19.prev = 33;
          _context19.t0 = _context19["catch"](18);
          _didIteratorError6 = true;
          _iteratorError6 = _context19.t0;

        case 37:
          _context19.prev = 37;
          _context19.prev = 38;

          if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
            _iterator6["return"]();
          }

        case 40:
          _context19.prev = 40;

          if (!_didIteratorError6) {
            _context19.next = 43;
            break;
          }

          throw _iteratorError6;

        case 43:
          return _context19.finish(40);

        case 44:
          return _context19.finish(37);

        case 45:
          res.status(200).json({
            assignItems: assignItems,
            message: "filtered"
          });
          _context19.next = 52;
          break;

        case 48:
          _context19.prev = 48;
          _context19.t1 = _context19["catch"](0);
          console.error(_context19.t1);
          res.status(500).json({
            success: false,
            error: "Internal server error"
          });

        case 52:
        case "end":
          return _context19.stop();
      }
    }
  }, null, null, [[0, 48], [18, 33, 37, 45], [38,, 40, 44]]);
});
var getVendorCategories = catchAsyncError(function _callee19(req, res, next) {
  var _vendorId3, vendor;

  return regeneratorRuntime.async(function _callee19$(_context20) {
    while (1) {
      switch (_context20.prev = _context20.next) {
        case 0:
          _context20.prev = 0;
          _vendorId3 = req.user._id;
          _context20.next = 4;
          return regeneratorRuntime.awrap(vendorCategories.findOne({
            vendorId: _vendorId3
          }));

        case 4:
          vendor = _context20.sent;
          console.log(vendor);

          if (vendor) {
            _context20.next = 8;
            break;
          }

          return _context20.abrupt("return", res.json({
            message: "vendor not found!"
          }));

        case 8:
          return _context20.abrupt("return", res.json({
            message: "successful",
            vendor: vendor
          }));

        case 11:
          _context20.prev = 11;
          _context20.t0 = _context20["catch"](0);
          return _context20.abrupt("return", res.json({
            message: "internal error!"
          }));

        case 14:
        case "end":
          return _context20.stop();
      }
    }
  }, null, null, [[0, 11]]);
});

var getVendorStockFunc = function getVendorStockFunc(vendorId) {
  var pipeline, stocks;
  return regeneratorRuntime.async(function getVendorStockFunc$(_context21) {
    while (1) {
      switch (_context21.prev = _context21.next) {
        case 0:
          pipeline = [{
            $match: {
              vendorId: new ObjectId(vendorId)
            }
          }, {
            $unwind: "$stocks"
          }, {
            $lookup: {
              from: "Items",
              localField: "stocks.itemId",
              foreignField: "_id",
              as: "itemDetails"
            }
          }, {
            $unwind: "$itemDetails"
          }, {
            $lookup: {
              from: "Images",
              localField: "stocks.itemId",
              foreignField: "itemId",
              as: "images"
            }
          }, {
            $unwind: "$images"
          }, {
            $addFields: {
              "stocks.itemDetails": "$itemDetails",
              "stocks.images": "$images"
            }
          }, {
            $group: {
              _id: "$_id",
              vendorId: {
                $first: "$vendorId"
              },
              stocks: {
                $push: "$stocks"
              }
            }
          }];
          _context21.next = 3;
          return regeneratorRuntime.awrap(vendorStock.aggregate(pipeline));

        case 3:
          stocks = _context21.sent;
          return _context21.abrupt("return", stocks);

        case 5:
        case "end":
          return _context21.stop();
      }
    }
  });
};

var getHotelItemsFunc = function getHotelItemsFunc(_ref) {
  var HotelId, vendorId, pipeline, itemList;
  return regeneratorRuntime.async(function getHotelItemsFunc$(_context22) {
    while (1) {
      switch (_context22.prev = _context22.next) {
        case 0:
          HotelId = _ref.HotelId, vendorId = _ref.vendorId;
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
          }];
          _context22.next = 4;
          return regeneratorRuntime.awrap(HotelItemPrice.aggregate(pipeline));

        case 4:
          itemList = _context22.sent;
          return _context22.abrupt("return", itemList);

        case 6:
        case "end":
          return _context22.stop();
      }
    }
  });
};

var addVendorItem = catchAsyncError(function _callee20(req, res, next) {
  var itemIds, _vendorId4, vendor, itemList;

  return regeneratorRuntime.async(function _callee20$(_context23) {
    while (1) {
      switch (_context23.prev = _context23.next) {
        case 0:
          _context23.prev = 0;
          itemIds = req.body.itemIds;
          _vendorId4 = req.user._id; // Validate required fields

          if (!(!itemIds || !Array.isArray(itemIds) || itemIds.length === 0)) {
            _context23.next = 5;
            break;
          }

          return _context23.abrupt("return", res.status(400).json({
            message: "Please provide an array of itemIds."
          }));

        case 5:
          _context23.prev = 5;
          _context23.next = 8;
          return regeneratorRuntime.awrap(VendorItems.findOne({
            vendorId: _vendorId4
          }));

        case 8:
          vendor = _context23.sent;
          _context23.next = 14;
          break;

        case 11:
          _context23.prev = 11;
          _context23.t0 = _context23["catch"](5);
          return _context23.abrupt("return", next(_context23.t0));

        case 14:
          if (vendor) {
            // Add each itemId from the array to the vendor's items
            itemIds.forEach(function (itemId) {
              vendor.items.push({
                itemId: itemId,
                todayCostPrice: 0
              });
            });
          } else {
            // Create a new vendor object with the array of itemIds
            vendor = new VendorItems({
              vendorId: _vendorId4,
              items: itemIds.map(function (itemId) {
                return {
                  itemId: itemId,
                  todayCostPrice: 0
                };
              })
            });
          } // Save the vendor object (either existing or new)


          _context23.next = 17;
          return regeneratorRuntime.awrap(vendor.save());

        case 17:
          _context23.next = 19;
          return regeneratorRuntime.awrap(getVendorItemsFunc(_vendorId4));

        case 19:
          itemList = _context23.sent;
          // Send success response only after successful save
          res.json({
            message: "Items added successfully",
            data: itemList
          });
          _context23.next = 26;
          break;

        case 23:
          _context23.prev = 23;
          _context23.t1 = _context23["catch"](0);
          // Pass any errors to the error handling middleware
          next(_context23.t1);

        case 26:
        case "end":
          return _context23.stop();
      }
    }
  }, null, null, [[0, 23], [5, 11]]);
});
var getAllVendorItems = catchAsyncError(function _callee21(req, res, next) {
  var _vendorId5, pageSize, offset, vendor;

  return regeneratorRuntime.async(function _callee21$(_context24) {
    while (1) {
      switch (_context24.prev = _context24.next) {
        case 0:
          _context24.prev = 0;
          console.log("abcdef");
          _vendorId5 = req.user._id;
          pageSize = 10;
          offset = req.body.offset;
          console.log(offset, "offset");
          _context24.next = 8;
          return regeneratorRuntime.awrap(VendorItems.aggregate([{
            $match: {
              vendorId: _vendorId5
            }
          }, {
            $unwind: "$items"
          }, {
            $lookup: {
              from: "Items",
              localField: "items.itemId",
              foreignField: "_id",
              as: "items.itemDetails"
            }
          }, {
            $unwind: "$items.itemDetails"
          }, {
            $lookup: {
              from: "Images",
              localField: "items.itemId",
              foreignField: "itemId",
              as: "items.images"
            }
          }, {
            $unwind: "$items.images"
          }, {
            $skip: offset
          }, {
            $limit: parseInt(pageSize)
          }]));

        case 8:
          vendor = _context24.sent;

          if (vendor) {
            _context24.next = 11;
            break;
          }

          return _context24.abrupt("return", res.json({
            message: "Vendor not found"
          }));

        case 11:
          console.log(vendor, "items"); // Send success response with vendor items

          res.json({
            message: "Vendor items retrieved successfully",
            data: vendor
          });
          _context24.next = 18;
          break;

        case 15:
          _context24.prev = 15;
          _context24.t0 = _context24["catch"](0);
          // Pass any errors to the error handling middleware
          next(_context24.t0);

        case 18:
        case "end":
          return _context24.stop();
      }
    }
  }, null, null, [[0, 15]]);
});
var itemsForVendor = catchAsyncError(function _callee22(req, res, next) {
  var _vendorId6, AllItems, vendorItems, assignedItemsArray, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7, _item8, ItemList;

  return regeneratorRuntime.async(function _callee22$(_context25) {
    while (1) {
      switch (_context25.prev = _context25.next) {
        case 0:
          _context25.prev = 0;
          _vendorId6 = req.user._id;
          _context25.next = 4;
          return regeneratorRuntime.awrap(Items.find({}));

        case 4:
          AllItems = _context25.sent;
          _context25.next = 7;
          return regeneratorRuntime.awrap(VendorItems.findOne({
            vendorId: _vendorId6
          }).select("items"));

        case 7:
          vendorItems = _context25.sent;

          if (vendorItems) {
            _context25.next = 10;
            break;
          }

          return _context25.abrupt("return", res.json({
            message: "Vendor items retrieved successfully",
            data: AllItems
          }));

        case 10:
          assignedItemsArray = [];
          _iteratorNormalCompletion7 = true;
          _didIteratorError7 = false;
          _iteratorError7 = undefined;
          _context25.prev = 14;

          for (_iterator7 = vendorItems.items[Symbol.iterator](); !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            _item8 = _step7.value;
            assignedItemsArray.push(_item8);
          } // console.log(AllItems, assignedItemsArray, "aia");


          _context25.next = 22;
          break;

        case 18:
          _context25.prev = 18;
          _context25.t0 = _context25["catch"](14);
          _didIteratorError7 = true;
          _iteratorError7 = _context25.t0;

        case 22:
          _context25.prev = 22;
          _context25.prev = 23;

          if (!_iteratorNormalCompletion7 && _iterator7["return"] != null) {
            _iterator7["return"]();
          }

        case 25:
          _context25.prev = 25;

          if (!_didIteratorError7) {
            _context25.next = 28;
            break;
          }

          throw _iteratorError7;

        case 28:
          return _context25.finish(25);

        case 29:
          return _context25.finish(22);

        case 30:
          ItemList = AllItems.filter(function (obj1) {
            return !assignedItemsArray.some(function (obj2) {
              return obj1._id.equals(obj2.itemId);
            });
          }); // console.log(ItemList, "il");
          // Send success response with vendor items

          res.json({
            message: "Vendor items retrieved successfully",
            data: ItemList
          });
          _context25.next = 37;
          break;

        case 34:
          _context25.prev = 34;
          _context25.t1 = _context25["catch"](0);
          // Pass any errors to the error handling middleware
          next(_context25.t1);

        case 37:
        case "end":
          return _context25.stop();
      }
    }
  }, null, null, [[0, 34], [14, 18, 22, 30], [23,, 25, 29]]);
});

var getVendorItemsFunc = function getVendorItemsFunc(vendorId) {
  var pipeline, itemList;
  return regeneratorRuntime.async(function getVendorItemsFunc$(_context26) {
    while (1) {
      switch (_context26.prev = _context26.next) {
        case 0:
          pipeline = [{
            $match: {
              vendorId: vendorId
            }
          }, {
            $unwind: "$items"
          }, {
            $lookup: {
              from: "Items",
              localField: "items.itemId",
              foreignField: "_id",
              as: "items.itemDetails"
            }
          }, {
            $unwind: "$items.itemDetails"
          }, {
            $lookup: {
              from: "Images",
              localField: "items.itemId",
              foreignField: "itemId",
              as: "items.images"
            }
          }, {
            $unwind: "$items.images"
          }];
          _context26.next = 3;
          return regeneratorRuntime.awrap(VendorItems.aggregate(pipeline));

        case 3:
          itemList = _context26.sent;
          return _context26.abrupt("return", itemList);

        case 5:
        case "end":
          return _context26.stop();
      }
    }
  });
};

var setVendorItemPrice = catchAsyncError(function _callee24(req, res, next) {
  var _req$body5, itemId, price, _vendorId7, updated, itemsToBeChange, data;

  return regeneratorRuntime.async(function _callee24$(_context28) {
    while (1) {
      switch (_context28.prev = _context28.next) {
        case 0:
          _context28.prev = 0;
          _req$body5 = req.body, itemId = _req$body5.itemId, price = _req$body5.price;
          _vendorId7 = req.user._id;

          if (!(!itemId || !price)) {
            _context28.next = 5;
            break;
          }

          throw new Error("All fields are required.");

        case 5:
          _context28.next = 7;
          return regeneratorRuntime.awrap(VendorItems.updateOne({
            vendorId: _vendorId7,
            "items.itemId": itemId
          }, // Find vendor and item
          {
            $set: {
              "items.$.todayCostPrice": price
            }
          } // Update nested item
          ));

        case 7:
          updated = _context28.sent;
          _context28.next = 10;
          return regeneratorRuntime.awrap(HotelItemPrice.find({
            itemId: itemId,
            vendorId: _vendorId7
          }));

        case 10:
          itemsToBeChange = _context28.sent;
          console.log(itemsToBeChange, "itemsToBeChange");

          if (itemsToBeChange.length !== 0) {
            itemsToBeChange.forEach(function _callee23(item) {
              var newProfitPercentage, updatedCostPrice, doc;
              return regeneratorRuntime.async(function _callee23$(_context27) {
                while (1) {
                  switch (_context27.prev = _context27.next) {
                    case 0:
                      if (!(item.pastPercentageProfits.length > 3)) {
                        _context27.next = 13;
                        break;
                      }

                    case 1:
                      _context27.next = 3;
                      return regeneratorRuntime.awrap(freshoCalculator(item.pastPercentageProfits));

                    case 3:
                      newProfitPercentage = _context27.sent;

                    case 4:
                      if (newProfitPercentage < 0) {
                        _context27.next = 1;
                        break;
                      }

                    case 5:
                      updatedCostPrice = price + newProfitPercentage * price;
                      _context27.next = 8;
                      return regeneratorRuntime.awrap(HotelItemPrice.findOneAndUpdate({
                        itemId: item.itemId,
                        vendorId: _vendorId7
                      }, {
                        $set: {
                          todayCostPrice: parseFloat(updatedCostPrice).toFixed(2),
                          todayPercentageProfit: parseFloat(newProfitPercentage).toFixed(2)
                        },
                        $push: {
                          pastPercentageProfits: {
                            $each: [parseFloat(newProfitPercentage).toFixed(2)],
                            $position: 0,
                            $slice: 10
                          }
                        }
                      }, {
                        "new": true
                      }));

                    case 8:
                      doc = _context27.sent;
                      console.log(doc, "doc"); // Check if pastPercentageProfits length is greater than 10

                      if (!(doc.pastPercentageProfits.length > 10)) {
                        _context27.next = 13;
                        break;
                      }

                      _context27.next = 13;
                      return regeneratorRuntime.awrap(HotelItemPrice.updateOne({
                        itemId: item.itemId,
                        vendorId: _vendorId7
                      }, {
                        $set: {
                          pastPercentageProfits: doc.pastPercentageProfits.slice(0, 10)
                        }
                      }));

                    case 13:
                    case "end":
                      return _context27.stop();
                  }
                }
              });
            });
          }

          _context28.next = 15;
          return regeneratorRuntime.awrap(getVendorItemsFunc(_vendorId7));

        case 15:
          data = _context28.sent;
          return _context28.abrupt("return", res.status(200).json({
            message: "Price updated successfully.",
            data: data
          }));

        case 19:
          _context28.prev = 19;
          _context28.t0 = _context28["catch"](0);
          console.log(_context28.t0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 23:
        case "end":
          return _context28.stop();
      }
    }
  }, null, null, [[0, 19]]);
});

var removeVendorItem = function removeVendorItem(req, res, next) {
  var itemId, _vendorId8, updated, isAssigned, removed, itemList;

  return regeneratorRuntime.async(function removeVendorItem$(_context29) {
    while (1) {
      switch (_context29.prev = _context29.next) {
        case 0:
          _context29.prev = 0;
          itemId = req.body.itemId;
          _vendorId8 = req.user._id;
          _context29.next = 5;
          return regeneratorRuntime.awrap(VendorItems.updateOne({
            vendorId: _vendorId8,
            "items.itemId": itemId
          }, // Find vendor and item
          {
            $pull: {
              items: {
                itemId: itemId
              }
            }
          } // Remove item from array
          ));

        case 5:
          updated = _context29.sent;

          if (!(updated.matchedCount === 0)) {
            _context29.next = 8;
            break;
          }

          return _context29.abrupt("return", res.status(404).json({
            message: "Vendor item not found"
          }));

        case 8:
          _context29.next = 10;
          return regeneratorRuntime.awrap(hotelItemPrice.find({
            vendorId: _vendorId8,
            itemId: itemId
          }));

        case 10:
          isAssigned = _context29.sent;

          if (!isAssigned) {
            _context29.next = 15;
            break;
          }

          _context29.next = 14;
          return regeneratorRuntime.awrap(hotelItemPrice.deleteMany({
            vendorId: _vendorId8,
            itemId: itemId
          }));

        case 14:
          removed = _context29.sent;

        case 15:
          _context29.next = 17;
          return regeneratorRuntime.awrap(getVendorItemsFunc(_vendorId8));

        case 17:
          itemList = _context29.sent;
          // Get updated item list
          res.json({
            message: "Item removed successfully",
            data: itemList
          });
          _context29.next = 24;
          break;

        case 21:
          _context29.prev = 21;
          _context29.t0 = _context29["catch"](0);
          next(_context29.t0); // Pass errors to error handling middleware

        case 24:
        case "end":
          return _context29.stop();
      }
    }
  }, null, null, [[0, 21]]);
};

var getVendorOrderAnalytics = catchAsyncError(function _callee25(req, res, next) {
  var vendorId, duration, status, today, getLastWeekData, getLastMonthData, getLastSixMonthsData;
  return regeneratorRuntime.async(function _callee25$(_context34) {
    while (1) {
      switch (_context34.prev = _context34.next) {
        case 0:
          getLastSixMonthsData = function _ref4() {
            var result, _loop4, i;

            return regeneratorRuntime.async(function getLastSixMonthsData$(_context33) {
              while (1) {
                switch (_context33.prev = _context33.next) {
                  case 0:
                    result = []; // Loop through the last 6 months

                    _loop4 = function _loop4(i) {
                      var monthEnd, monthStart, orders, monthData;
                      return regeneratorRuntime.async(function _loop4$(_context32) {
                        while (1) {
                          switch (_context32.prev = _context32.next) {
                            case 0:
                              monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0); // End of the current month

                              monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1); // Start of the current month
                              // Find orders within the current month

                              _context32.next = 4;
                              return regeneratorRuntime.awrap(UserOrder.find({
                                vendorId: vendorId,
                                createdAt: {
                                  $gte: monthStart,
                                  $lte: monthEnd
                                },
                                orderStatus: {
                                  $ne: status._id
                                }
                              }));

                            case 4:
                              orders = _context32.sent;
                              // Aggregate data for the current month
                              monthData = {
                                month: monthStart.toLocaleString("default", {
                                  month: "long"
                                }),
                                year: monthStart.getFullYear(),
                                price: 0,
                                quantity: {
                                  kg: 0,
                                  gram: 0
                                }
                              };
                              orders.forEach(function (order) {
                                monthData.price += order.totalPrice;
                                order.orderedItems.forEach(function (item) {
                                  // Add kg directly to the total quantity for the day
                                  monthData.quantity.kg += item.quantity.kg; // Add grams to the total grams for the day

                                  monthData.quantity.gram += item.quantity.gram; // Adjust kg and gram if gram value exceeds 1000

                                  if (monthData.quantity.gram >= 1000) {
                                    monthData.quantity.kg += Math.floor(monthData.quantity.gram / 1000);
                                    monthData.quantity.gram %= 1000;
                                  }
                                });
                              });
                              result.unshift(monthData); // Add the month's data to the beginning of the result array

                            case 8:
                            case "end":
                              return _context32.stop();
                          }
                        }
                      });
                    };

                    i = 0;

                  case 3:
                    if (!(i < 6)) {
                      _context33.next = 9;
                      break;
                    }

                    _context33.next = 6;
                    return regeneratorRuntime.awrap(_loop4(i));

                  case 6:
                    i++;
                    _context33.next = 3;
                    break;

                  case 9:
                    return _context33.abrupt("return", result.reverse());

                  case 10:
                  case "end":
                    return _context33.stop();
                }
              }
            });
          };

          getLastMonthData = function _ref3() {
            var result, monthEnd, monthStart, orders, _loop3, i;

            return regeneratorRuntime.async(function getLastMonthData$(_context31) {
              while (1) {
                switch (_context31.prev = _context31.next) {
                  case 0:
                    result = [];
                    monthEnd = new Date(today); // Month end is today

                    monthStart = new Date(today); // Month start is 30 days before today

                    monthStart.setDate(today.getDate() - 30); // Find orders within the last month

                    _context31.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      vendorId: vendorId,
                      createdAt: {
                        $gte: monthStart,
                        $lte: monthEnd
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context31.sent;

                    _loop3 = function _loop3(i) {
                      var currentDate = new Date(today);
                      currentDate.setDate(today.getDate() - i);
                      var dayData = {
                        day: currentDate.getDate(),
                        price: 0,
                        quantity: {
                          kg: 0,
                          gram: 0
                        }
                      }; // Find orders for the current day

                      var dayOrders = orders.filter(function (order) {
                        return order.createdAt.toDateString() === currentDate.toDateString();
                      }); // Aggregate data for the current day

                      dayOrders.forEach(function (order) {
                        dayData.price += order.totalPrice;
                        order.orderedItems.forEach(function (item) {
                          // Add kg directly to the total quantity for the day
                          dayData.quantity.kg += item.quantity.kg; // Add grams to the total grams for the day

                          dayData.quantity.gram += item.quantity.gram; // Adjust kg and gram if gram value exceeds 1000

                          if (dayData.quantity.gram >= 1000) {
                            dayData.quantity.kg += Math.floor(dayData.quantity.gram / 1000);
                            dayData.quantity.gram %= 1000;
                          }
                        });
                      }); // Insert current day's data at the beginning of the result array

                      result.unshift(dayData);
                    };

                    // Loop through each day of the month starting from today and going back 30 days
                    for (i = 0; i < 30; i++) {
                      _loop3(i);
                    } // Return the result


                    return _context31.abrupt("return", result.reverse());

                  case 10:
                  case "end":
                    return _context31.stop();
                }
              }
            });
          };

          getLastWeekData = function _ref2() {
            var result, weekEnd, weekStart, orders, daysOfWeek, _loop2, i;

            return regeneratorRuntime.async(function getLastWeekData$(_context30) {
              while (1) {
                switch (_context30.prev = _context30.next) {
                  case 0:
                    result = [];
                    weekEnd = new Date(today);
                    weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - 6);
                    _context30.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      vendorId: vendorId,
                      createdAt: {
                        $gte: weekStart,
                        $lte: weekEnd
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context30.sent;
                    daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                    _loop2 = function _loop2(i) {
                      var day = daysOfWeek[(today.getDay() + 7 - i) % 7];
                      var dayData = {
                        day: day,
                        price: 0,
                        quantity: {
                          kg: 0,
                          gram: 0
                        }
                      };
                      var dayOrders = orders.filter(function (order) {
                        var orderDay = order.createdAt.toLocaleDateString("en-US", {
                          weekday: "short"
                        });
                        return orderDay === day;
                      });
                      dayOrders.forEach(function (order) {
                        dayData.price += order.totalPrice;
                        var quantity = order.orderedItems.reduce(function (acc, item) {
                          acc.kg += item.quantity.kg;
                          acc.gram += item.quantity.gram;
                          return acc;
                        }, {
                          kg: 0,
                          gram: 0
                        });
                        dayData.quantity.kg += quantity.kg;
                        dayData.quantity.gram += quantity.gram;
                      });
                      result.push(dayData);
                    };

                    for (i = 0; i < 7; i++) {
                      _loop2(i);
                    }

                    return _context30.abrupt("return", result);

                  case 11:
                  case "end":
                    return _context30.stop();
                }
              }
            });
          };

          vendorId = req.user._id;
          duration = req.body.duration;
          _context34.next = 7;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: "Cancelled"
          }));

        case 7:
          status = _context34.sent;
          today = new Date();

          if (!(duration === "week")) {
            _context34.next = 13;
            break;
          }

          return _context34.abrupt("return", getLastWeekData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 13:
          if (!(duration === "month")) {
            _context34.next = 17;
            break;
          }

          return _context34.abrupt("return", getLastMonthData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 17:
          if (!(duration === "sixMonths")) {
            _context34.next = 21;
            break;
          }

          return _context34.abrupt("return", getLastSixMonthsData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 21:
          return _context34.abrupt("return", res.status(404).json({
            error: "Incorrect duration selected"
          }));

        case 22:
        case "end":
          return _context34.stop();
      }
    }
  });
});
var getItemAnalytics = catchAsyncError(function _callee29(req, res, next) {
  var vendorId, duration, status, itemDetailsArray, getItemName, today, getLastWeekData, getLastMonthData, getLastSixMonthsData;
  return regeneratorRuntime.async(function _callee29$(_context42) {
    while (1) {
      switch (_context42.prev = _context42.next) {
        case 0:
          getLastSixMonthsData = function _ref7() {
            var result, sixMonthsAgo, startDate, endDate, orders, itemsList, itemDetails, _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, _item11, obj, _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13, order, extraKg, info;

            return regeneratorRuntime.async(function getLastSixMonthsData$(_context41) {
              while (1) {
                switch (_context41.prev = _context41.next) {
                  case 0:
                    result = []; // Loop through the last 6 months

                    sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1); // Six months ago from the current month
                    // Calculate start and end dates for the six-month period

                    startDate = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1); // Start of the first month

                    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of the last month
                    // Find orders within the past six months

                    _context41.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      vendorId: vendorId,
                      createdAt: {
                        $gte: startDate,
                        $lte: endDate
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context41.sent;
                    _context41.next = 9;
                    return regeneratorRuntime.awrap(VendorItems.findOne({
                      vendorId: vendorId
                    }).select("items"));

                  case 9:
                    itemsList = _context41.sent;
                    itemDetails = itemsList.items.reduce(function (acc, item) {
                      acc[item.itemId] = {
                        itemId: item.itemId,
                        todayCostPrice: item.todayCostPrice,
                        orderedItems: []
                      };
                      return acc;
                    }, {}); // Iterate through orders and add ordered items details to itemDetails

                    orders.forEach(function (order) {
                      order.orderedItems.forEach(function _callee28(orderedItem) {
                        var itemId;
                        return regeneratorRuntime.async(function _callee28$(_context40) {
                          while (1) {
                            switch (_context40.prev = _context40.next) {
                              case 0:
                                itemId = orderedItem.itemId;

                                if (itemDetails[itemId]) {
                                  // If the item exists in itemDetails, add ordered item details to it
                                  itemDetails[itemId].orderedItems.push(orderedItem);
                                }

                              case 2:
                              case "end":
                                return _context40.stop();
                            }
                          }
                        });
                      });
                    });
                    itemDetailsArray = Object.values(itemDetails);
                    _iteratorNormalCompletion12 = true;
                    _didIteratorError12 = false;
                    _iteratorError12 = undefined;
                    _context41.prev = 16;
                    _iterator12 = itemDetailsArray[Symbol.iterator]();

                  case 18:
                    if (_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done) {
                      _context41.next = 49;
                      break;
                    }

                    _item11 = _step12.value;
                    obj = {
                      totalQuantity: {
                        kg: 0,
                        gram: 0
                      },
                      totalPrice: 0
                    };
                    _iteratorNormalCompletion13 = true;
                    _didIteratorError13 = false;
                    _iteratorError13 = undefined;
                    _context41.prev = 24;

                    for (_iterator13 = _item11.orderedItems[Symbol.iterator](); !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                      order = _step13.value;
                      obj.totalQuantity.kg += order.quantity.kg;
                      obj.totalQuantity.gram += order.quantity.gram;

                      if (obj.totalQuantity.gram >= 1000) {
                        extraKg = Math.floor(obj.totalQuantity.gram / 1000); // Calculate extra kilograms

                        obj.totalQuantity.kg += extraKg; // Add extra kilograms

                        obj.totalQuantity.gram %= 1000; // Update grams to the remainder after conversion to kilograms
                      }

                      obj.totalPrice += order.quantity.kg * order.price + order.quantity.gram / 1000 * order.price;
                    }

                    _context41.next = 32;
                    break;

                  case 28:
                    _context41.prev = 28;
                    _context41.t0 = _context41["catch"](24);
                    _didIteratorError13 = true;
                    _iteratorError13 = _context41.t0;

                  case 32:
                    _context41.prev = 32;
                    _context41.prev = 33;

                    if (!_iteratorNormalCompletion13 && _iterator13["return"] != null) {
                      _iterator13["return"]();
                    }

                  case 35:
                    _context41.prev = 35;

                    if (!_didIteratorError13) {
                      _context41.next = 38;
                      break;
                    }

                    throw _iteratorError13;

                  case 38:
                    return _context41.finish(35);

                  case 39:
                    return _context41.finish(32);

                  case 40:
                    _item11.orderedItems = obj;
                    _context41.next = 43;
                    return regeneratorRuntime.awrap(getItemName(_item11.itemId));

                  case 43:
                    info = _context41.sent;
                    _item11.name = info.name;
                    _item11.image = info.image;

                  case 46:
                    _iteratorNormalCompletion12 = true;
                    _context41.next = 18;
                    break;

                  case 49:
                    _context41.next = 55;
                    break;

                  case 51:
                    _context41.prev = 51;
                    _context41.t1 = _context41["catch"](16);
                    _didIteratorError12 = true;
                    _iteratorError12 = _context41.t1;

                  case 55:
                    _context41.prev = 55;
                    _context41.prev = 56;

                    if (!_iteratorNormalCompletion12 && _iterator12["return"] != null) {
                      _iterator12["return"]();
                    }

                  case 58:
                    _context41.prev = 58;

                    if (!_didIteratorError12) {
                      _context41.next = 61;
                      break;
                    }

                    throw _iteratorError12;

                  case 61:
                    return _context41.finish(58);

                  case 62:
                    return _context41.finish(55);

                  case 63:
                    return _context41.abrupt("return", itemDetailsArray);

                  case 64:
                  case "end":
                    return _context41.stop();
                }
              }
            }, null, null, [[16, 51, 55, 63], [24, 28, 32, 40], [33,, 35, 39], [56,, 58, 62]]);
          };

          getLastMonthData = function _ref6() {
            var result, monthEnd, monthStart, orders, itemsList, itemDetails, _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, _item10, obj, _iteratorNormalCompletion11, _didIteratorError11, _iteratorError11, _iterator11, _step11, order, info;

            return regeneratorRuntime.async(function getLastMonthData$(_context39) {
              while (1) {
                switch (_context39.prev = _context39.next) {
                  case 0:
                    result = [];
                    monthEnd = new Date(today); // Month end is today

                    monthStart = new Date(today); // Month start is 30 days before today

                    monthStart.setDate(today.getDate() - 30); // Find orders within the last month

                    _context39.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      vendorId: vendorId,
                      createdAt: {
                        $gte: monthStart,
                        $lte: monthEnd
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context39.sent;
                    _context39.next = 9;
                    return regeneratorRuntime.awrap(VendorItems.findOne({
                      vendorId: vendorId
                    }).select("items"));

                  case 9:
                    itemsList = _context39.sent;
                    itemDetails = itemsList.items.reduce(function (acc, item) {
                      acc[item.itemId] = {
                        itemId: item.itemId,
                        todayCostPrice: item.todayCostPrice,
                        orderedItems: []
                      };
                      return acc;
                    }, {}); // Iterate through orders and add ordered items details to itemDetails

                    orders.forEach(function (order) {
                      order.orderedItems.forEach(function _callee27(orderedItem) {
                        var itemId;
                        return regeneratorRuntime.async(function _callee27$(_context38) {
                          while (1) {
                            switch (_context38.prev = _context38.next) {
                              case 0:
                                itemId = orderedItem.itemId;

                                if (itemDetails[itemId]) {
                                  // If the item exists in itemDetails, add ordered item details to it
                                  itemDetails[itemId].orderedItems.push(orderedItem);
                                }

                              case 2:
                              case "end":
                                return _context38.stop();
                            }
                          }
                        });
                      });
                    });
                    itemDetailsArray = Object.values(itemDetails);
                    _iteratorNormalCompletion10 = true;
                    _didIteratorError10 = false;
                    _iteratorError10 = undefined;
                    _context39.prev = 16;
                    _iterator10 = itemDetailsArray[Symbol.iterator]();

                  case 18:
                    if (_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done) {
                      _context39.next = 49;
                      break;
                    }

                    _item10 = _step10.value;
                    obj = {
                      totalQuantity: {
                        kg: 0,
                        gram: 0
                      },
                      totalPrice: 0
                    };
                    _iteratorNormalCompletion11 = true;
                    _didIteratorError11 = false;
                    _iteratorError11 = undefined;
                    _context39.prev = 24;

                    for (_iterator11 = _item10.orderedItems[Symbol.iterator](); !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                      order = _step11.value;
                      obj.totalQuantity.kg += order.quantity.kg;
                      obj.totalQuantity.gram += order.quantity.gram;
                      obj.totalPrice += order.quantity.kg * order.price + order.quantity.gram / 1000 * order.price;
                    }

                    _context39.next = 32;
                    break;

                  case 28:
                    _context39.prev = 28;
                    _context39.t0 = _context39["catch"](24);
                    _didIteratorError11 = true;
                    _iteratorError11 = _context39.t0;

                  case 32:
                    _context39.prev = 32;
                    _context39.prev = 33;

                    if (!_iteratorNormalCompletion11 && _iterator11["return"] != null) {
                      _iterator11["return"]();
                    }

                  case 35:
                    _context39.prev = 35;

                    if (!_didIteratorError11) {
                      _context39.next = 38;
                      break;
                    }

                    throw _iteratorError11;

                  case 38:
                    return _context39.finish(35);

                  case 39:
                    return _context39.finish(32);

                  case 40:
                    _item10.orderedItems = obj;
                    _context39.next = 43;
                    return regeneratorRuntime.awrap(getItemName(_item10.itemId));

                  case 43:
                    info = _context39.sent;
                    _item10.name = info.name;
                    _item10.image = info.image;

                  case 46:
                    _iteratorNormalCompletion10 = true;
                    _context39.next = 18;
                    break;

                  case 49:
                    _context39.next = 55;
                    break;

                  case 51:
                    _context39.prev = 51;
                    _context39.t1 = _context39["catch"](16);
                    _didIteratorError10 = true;
                    _iteratorError10 = _context39.t1;

                  case 55:
                    _context39.prev = 55;
                    _context39.prev = 56;

                    if (!_iteratorNormalCompletion10 && _iterator10["return"] != null) {
                      _iterator10["return"]();
                    }

                  case 58:
                    _context39.prev = 58;

                    if (!_didIteratorError10) {
                      _context39.next = 61;
                      break;
                    }

                    throw _iteratorError10;

                  case 61:
                    return _context39.finish(58);

                  case 62:
                    return _context39.finish(55);

                  case 63:
                    return _context39.abrupt("return", itemDetailsArray);

                  case 64:
                  case "end":
                    return _context39.stop();
                }
              }
            }, null, null, [[16, 51, 55, 63], [24, 28, 32, 40], [33,, 35, 39], [56,, 58, 62]]);
          };

          getLastWeekData = function _ref5() {
            var result, weekEnd, weekStart, orders, itemsList, itemDetails, _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, _item9, obj, _iteratorNormalCompletion9, _didIteratorError9, _iteratorError9, _iterator9, _step9, order, info;

            return regeneratorRuntime.async(function getLastWeekData$(_context37) {
              while (1) {
                switch (_context37.prev = _context37.next) {
                  case 0:
                    result = [];
                    weekEnd = new Date(today);
                    weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - 6);
                    _context37.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      vendorId: vendorId,
                      createdAt: {
                        $gte: weekStart,
                        $lte: weekEnd
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context37.sent;
                    _context37.next = 9;
                    return regeneratorRuntime.awrap(VendorItems.findOne({
                      vendorId: vendorId
                    }).select("items"));

                  case 9:
                    itemsList = _context37.sent;
                    itemDetails = itemsList.items.reduce(function (acc, item) {
                      acc[item.itemId] = {
                        itemId: item.itemId,
                        todayCostPrice: item.todayCostPrice,
                        orderedItems: []
                      };
                      return acc;
                    }, {}); // Iterate through orders and add ordered items details to itemDetails

                    orders.forEach(function (order) {
                      order.orderedItems.forEach(function _callee26(orderedItem) {
                        var itemId;
                        return regeneratorRuntime.async(function _callee26$(_context36) {
                          while (1) {
                            switch (_context36.prev = _context36.next) {
                              case 0:
                                itemId = orderedItem.itemId;

                                if (itemDetails[itemId]) {
                                  // If the item exists in itemDetails, add ordered item details to it
                                  itemDetails[itemId].orderedItems.push(orderedItem);
                                }

                              case 2:
                              case "end":
                                return _context36.stop();
                            }
                          }
                        });
                      });
                    });
                    itemDetailsArray = Object.values(itemDetails);
                    _iteratorNormalCompletion8 = true;
                    _didIteratorError8 = false;
                    _iteratorError8 = undefined;
                    _context37.prev = 16;
                    _iterator8 = itemDetailsArray[Symbol.iterator]();

                  case 18:
                    if (_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done) {
                      _context37.next = 49;
                      break;
                    }

                    _item9 = _step8.value;
                    obj = {
                      totalQuantity: {
                        kg: 0,
                        gram: 0
                      },
                      totalPrice: 0
                    };
                    _iteratorNormalCompletion9 = true;
                    _didIteratorError9 = false;
                    _iteratorError9 = undefined;
                    _context37.prev = 24;

                    for (_iterator9 = _item9.orderedItems[Symbol.iterator](); !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                      order = _step9.value;
                      obj.totalQuantity.kg += order.quantity.kg;
                      obj.totalQuantity.gram += order.quantity.gram;
                      obj.totalPrice += order.quantity.kg * order.price + order.quantity.gram / 1000 * order.price;
                    }

                    _context37.next = 32;
                    break;

                  case 28:
                    _context37.prev = 28;
                    _context37.t0 = _context37["catch"](24);
                    _didIteratorError9 = true;
                    _iteratorError9 = _context37.t0;

                  case 32:
                    _context37.prev = 32;
                    _context37.prev = 33;

                    if (!_iteratorNormalCompletion9 && _iterator9["return"] != null) {
                      _iterator9["return"]();
                    }

                  case 35:
                    _context37.prev = 35;

                    if (!_didIteratorError9) {
                      _context37.next = 38;
                      break;
                    }

                    throw _iteratorError9;

                  case 38:
                    return _context37.finish(35);

                  case 39:
                    return _context37.finish(32);

                  case 40:
                    _item9.orderedItems = obj;
                    _context37.next = 43;
                    return regeneratorRuntime.awrap(getItemName(_item9.itemId));

                  case 43:
                    info = _context37.sent;
                    _item9.name = info.name;
                    _item9.image = info.image;

                  case 46:
                    _iteratorNormalCompletion8 = true;
                    _context37.next = 18;
                    break;

                  case 49:
                    _context37.next = 55;
                    break;

                  case 51:
                    _context37.prev = 51;
                    _context37.t1 = _context37["catch"](16);
                    _didIteratorError8 = true;
                    _iteratorError8 = _context37.t1;

                  case 55:
                    _context37.prev = 55;
                    _context37.prev = 56;

                    if (!_iteratorNormalCompletion8 && _iterator8["return"] != null) {
                      _iterator8["return"]();
                    }

                  case 58:
                    _context37.prev = 58;

                    if (!_didIteratorError8) {
                      _context37.next = 61;
                      break;
                    }

                    throw _iteratorError8;

                  case 61:
                    return _context37.finish(58);

                  case 62:
                    return _context37.finish(55);

                  case 63:
                    return _context37.abrupt("return", itemDetailsArray);

                  case 64:
                  case "end":
                    return _context37.stop();
                }
              }
            }, null, null, [[16, 51, 55, 63], [24, 28, 32, 40], [33,, 35, 39], [56,, 58, 62]]);
          };

          vendorId = req.user._id;
          duration = req.body.duration;
          _context42.next = 7;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: "Cancelled"
          }));

        case 7:
          status = _context42.sent;
          itemDetailsArray = [];

          getItemName = function getItemName(itemId) {
            var items, image, itemObj;
            return regeneratorRuntime.async(function getItemName$(_context35) {
              while (1) {
                switch (_context35.prev = _context35.next) {
                  case 0:
                    _context35.next = 2;
                    return regeneratorRuntime.awrap(Items.findOne({
                      _id: itemId
                    }));

                  case 2:
                    items = _context35.sent;
                    _context35.next = 5;
                    return regeneratorRuntime.awrap(Image.findOne({
                      itemId: itemId
                    }));

                  case 5:
                    image = _context35.sent;
                    itemObj = {
                      name: items.name,
                      image: image.img
                    };
                    return _context35.abrupt("return", itemObj);

                  case 8:
                  case "end":
                    return _context35.stop();
                }
              }
            });
          };

          today = new Date();

          if (!(duration === "week")) {
            _context42.next = 15;
            break;
          }

          return _context42.abrupt("return", getLastWeekData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 15:
          if (!(duration === "month")) {
            _context42.next = 19;
            break;
          }

          return _context42.abrupt("return", getLastMonthData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 19:
          if (!(duration === "sixMonths")) {
            _context42.next = 23;
            break;
          }

          return _context42.abrupt("return", getLastSixMonthsData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 23:
          return _context42.abrupt("return", res.status(404).json({
            error: "Incorrect duration selected"
          }));

        case 24:
        case "end":
          return _context42.stop();
      }
    }
  });
});

function freshoCalculator(lastTenDaysProfitPercentage) {
  var paddedInput, model, prediction, predictionValue;
  return regeneratorRuntime.async(function freshoCalculator$(_context43) {
    while (1) {
      switch (_context43.prev = _context43.next) {
        case 0:
          _context43.prev = 0;

          if (Array.isArray(lastTenDaysProfitPercentage)) {
            _context43.next = 3;
            break;
          }

          throw new Error("Invalid input: lastTenDaysProfitPercentage must be an array.");

        case 3:
          // Pad the input array with zeros if it has less than 10 elements
          paddedInput = lastTenDaysProfitPercentage.concat(Array(10 - lastTenDaysProfitPercentage.length).fill(0));
          _context43.next = 6;
          return regeneratorRuntime.awrap(initModel());

        case 6:
          model = _context43.sent;
          _context43.next = 9;
          return regeneratorRuntime.awrap(model.predict(tf.tensor2d([paddedInput])));

        case 9:
          prediction = _context43.sent;
          _context43.next = 12;
          return regeneratorRuntime.awrap(prediction.array());

        case 12:
          predictionValue = _context43.sent[0][0];
          return _context43.abrupt("return", predictionValue);

        case 16:
          _context43.prev = 16;
          _context43.t0 = _context43["catch"](0);
          console.error("Error:", _context43.t0.message);
          return _context43.abrupt("return", null);

        case 20:
        case "end":
          return _context43.stop();
      }
    }
  }, null, null, [[0, 16]]);
}

function initModel() {
  var X, y, i, lastTenDaysProfitPercentage, todayProfitPercentage, X_train, y_train, model;
  return regeneratorRuntime.async(function initModel$(_context44) {
    while (1) {
      switch (_context44.prev = _context44.next) {
        case 0:
          X = [];
          y = [];

          for (i = 0; i < 100; i++) {
            lastTenDaysProfitPercentage = Array.from({
              length: 10
            }, function () {
              return Math.random();
            });
            todayProfitPercentage = Math.random();
            X.push(lastTenDaysProfitPercentage);
            y.push([todayProfitPercentage]);
          }

          X_train = tf.tensor2d(X);
          y_train = tf.tensor2d(y);
          model = createModel();
          _context44.next = 8;
          return regeneratorRuntime.awrap(model.fit(X_train, y_train, {
            epochs: 100
          }));

        case 8:
          return _context44.abrupt("return", model);

        case 9:
        case "end":
          return _context44.stop();
      }
    }
  });
}

function createModel() {
  var model = tf.sequential();
  model.add(tf.layers.dense({
    units: 50,
    inputShape: [10]
  }));
  model.add(tf.layers.dense({
    units: 1
  }));
  model.compile({
    optimizer: "adam",
    loss: "meanSquaredError"
  });
  return model;
}

var updateHotelItemProfit = function updateHotelItemProfit(req, res, next) {
  var _req$body6, _hotelId2, itemId, newPercentage, _vendorId9, updatedDoc, itemPrice, selectedItem, costPrice, newPrice, updatedPrice, newDoc, itemList;

  return regeneratorRuntime.async(function updateHotelItemProfit$(_context45) {
    while (1) {
      switch (_context45.prev = _context45.next) {
        case 0:
          _context45.prev = 0;
          _req$body6 = req.body, _hotelId2 = _req$body6.hotelId, itemId = _req$body6.itemId, newPercentage = _req$body6.newPercentage;
          _vendorId9 = req.user._id;
          _context45.next = 5;
          return regeneratorRuntime.awrap(HotelItemPrice.findOne({
            hotelId: _hotelId2,
            itemId: itemId
          }));

        case 5:
          updatedDoc = _context45.sent;

          if (updatedDoc) {
            _context45.next = 8;
            break;
          }

          return _context45.abrupt("return", res.json({
            message: "Failed to fetch HotelItem"
          }));

        case 8:
          _context45.next = 10;
          return regeneratorRuntime.awrap(VendorItems.findOne({
            vendorId: _vendorId9
          }));

        case 10:
          itemPrice = _context45.sent;
          // Find the item with the specified itemId
          selectedItem = itemPrice.items.find(function (item) {
            return item.itemId.equals(new ObjectId(itemId));
          });

          if (selectedItem) {
            _context45.next = 14;
            break;
          }

          return _context45.abrupt("return", res.status(404).json({
            message: "Item not found"
          }));

        case 14:
          // Calculate the new price based on the cost price and profit percentage
          costPrice = selectedItem.todayCostPrice;
          newPrice = costPrice + costPrice * newPercentage;
          _context45.next = 18;
          return regeneratorRuntime.awrap(HotelItemPrice.findOneAndUpdate({
            vendorId: _vendorId9,
            itemId: itemId,
            hotelId: _hotelId2
          }, {
            $set: {
              todayCostPrice: newPrice
            }
          }, {
            "new": true
          }));

        case 18:
          updatedPrice = _context45.sent;
          _context45.next = 21;
          return regeneratorRuntime.awrap(HotelItemPrice.findOneAndUpdate({
            hotelId: _hotelId2,
            itemId: itemId
          }, [{
            $set: {
              pastPercentageProfits: {
                $cond: {
                  "if": {
                    $lt: [{
                      $size: "$pastPercentageProfits"
                    }, 10]
                  },
                  // Check if less than 10 elements
                  then: {
                    $concatArrays: [[newPercentage], "$pastPercentageProfits"]
                  },
                  // Add to the beginning if less than 10
                  "else": {
                    $concatArrays: [[newPercentage], {
                      $slice: ["$pastPercentageProfits", 0, 9]
                    }]
                  } // Add and slice if full

                }
              },
              todayPercentageProfit: newPercentage // Set todayPercentageProfit to newPercentage

            }
          }], {
            "new": true
          } // Return the updated document
          ));

        case 21:
          newDoc = _context45.sent;
          _context45.next = 24;
          return regeneratorRuntime.awrap(getHotelItemsFunc({
            HotelId: _hotelId2,
            vendorId: _vendorId9
          }));

        case 24:
          itemList = _context45.sent;
          res.json({
            message: "Profit percentage updated successfully",
            data: itemList
          });
          _context45.next = 31;
          break;

        case 28:
          _context45.prev = 28;
          _context45.t0 = _context45["catch"](0);
          next(_context45.t0);

        case 31:
        case "end":
          return _context45.stop();
      }
    }
  }, null, null, [[0, 28]]);
};

var msgToSubVendor = catchAsyncErrors(function _callee30(req, res, next) {
  var response;
  return regeneratorRuntime.async(function _callee30$(_context46) {
    while (1) {
      switch (_context46.prev = _context46.next) {
        case 0:
          _context46.prev = 0;
          _context46.next = 3;
          return regeneratorRuntime.awrap(messageToSubvendor());

        case 3:
          response = _context46.sent;
          _context46.next = 6;
          return regeneratorRuntime.awrap(sendWhatsappmessge(response));

        case 6:
          res.status(200).json({
            data: response
          });
          _context46.next = 12;
          break;

        case 9:
          _context46.prev = 9;
          _context46.t0 = _context46["catch"](0);
          res.status(400).json({
            error: _context46.t0
          });

        case 12:
        case "end":
          return _context46.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
var getAllPaymentPlans = catchAsyncErrors(function _callee31(req, res, next) {
  var data;
  return regeneratorRuntime.async(function _callee31$(_context47) {
    while (1) {
      switch (_context47.prev = _context47.next) {
        case 0:
          _context47.prev = 0;
          _context47.next = 3;
          return regeneratorRuntime.awrap(PaymentPlan.find({}));

        case 3:
          data = _context47.sent;
          res.status(200).json({
            status: "success",
            data: data
          });
          _context47.next = 10;
          break;

        case 7:
          _context47.prev = 7;
          _context47.t0 = _context47["catch"](0);
          next(_context47.t0);

        case 10:
        case "end":
          return _context47.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
var selectedPaymentPlan = catchAsyncErrors(function _callee32(req, res, next) {
  var data;
  return regeneratorRuntime.async(function _callee32$(_context48) {
    while (1) {
      switch (_context48.prev = _context48.next) {
        case 0:
          _context48.prev = 0;
          _context48.next = 3;
          return regeneratorRuntime.awrap(PaymentPlan.find({}));

        case 3:
          data = _context48.sent;
          res.status(200).json({
            status: "success",
            data: data
          });
          _context48.next = 10;
          break;

        case 7:
          _context48.prev = 7;
          _context48.t0 = _context48["catch"](0);
          next(_context48.t0);

        case 10:
        case "end":
          return _context48.stop();
      }
    }
  }, null, null, [[0, 7]]);
});

var orderStatusUpdate = function orderStatusUpdate(req, res, next) {
  var initialStatus, updatedStatus, updateResult;
  return regeneratorRuntime.async(function orderStatusUpdate$(_context49) {
    while (1) {
      switch (_context49.prev = _context49.next) {
        case 0:
          _context49.prev = 0;
          _context49.next = 3;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: "Order Placed"
          }));

        case 3:
          initialStatus = _context49.sent;
          _context49.next = 6;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: "In Process"
          }));

        case 6:
          updatedStatus = _context49.sent;
          _context49.next = 9;
          return regeneratorRuntime.awrap(UserOrder.updateMany({
            orderStatus: initialStatus._id
          }, {
            $set: {
              orderStatus: updatedStatus._id
            }
          }));

        case 9:
          updateResult = _context49.sent;
          res.json({
            success: true,
            message: "Order statuses updated successfully",
            updateResult: updateResult
          });
          _context49.next = 16;
          break;

        case 13:
          _context49.prev = 13;
          _context49.t0 = _context49["catch"](0);
          console.log(_context49.t0);

        case 16:
        case "end":
          return _context49.stop();
      }
    }
  }, null, null, [[0, 13]]);
};

var generatePlanToken = catchAsyncErrors(function _callee33(req, res, next) {
  var userId, duration, plan, token, vendor;
  return regeneratorRuntime.async(function _callee33$(_context50) {
    while (1) {
      switch (_context50.prev = _context50.next) {
        case 0:
          _context50.prev = 0;
          userId = req.user._id;
          duration = req.body.duration;
          _context50.next = 5;
          return regeneratorRuntime.awrap(PaymentPlan.findOne({
            duration: duration
          }));

        case 5:
          plan = _context50.sent;
          _context50.next = 8;
          return regeneratorRuntime.awrap(generatePaymentToken({
            userId: userId,
            planDuration: duration
          }));

        case 8:
          token = _context50.sent;
          console.log(token, "token");

          if (token) {
            _context50.next = 12;
            break;
          }

          return _context50.abrupt("return", res.json({
            message: "Failed To Generate Token"
          }));

        case 12:
          _context50.next = 14;
          return regeneratorRuntime.awrap(user.findOne({
            _id: userId
          }));

        case 14:
          vendor = _context50.sent;

          if (!vendor.hasActiveSubscription) {
            _context50.next = 19;
            break;
          }

          return _context50.abrupt("return", res.json({
            message: "Vendor already has an active Subscription!"
          }));

        case 19:
          vendor.hasActiveSubscription = true;
          vendor.activeSubscription = plan._id;
          vendor.paymentToken = token;
          vendor.dateOfActivation = new Date();
          _context50.next = 25;
          return regeneratorRuntime.awrap(vendor.save());

        case 25:
          return _context50.abrupt("return", res.json({
            message: "Plan Activated!"
          }));

        case 28:
          _context50.prev = 28;
          _context50.t0 = _context50["catch"](0);
          console.log(_context50.t0, "errr");

        case 31:
        case "end":
          return _context50.stop();
      }
    }
  }, null, null, [[0, 28]]);
});
var changeOrderQuantity = catchAsyncErrors(function _callee34(req, res, next) {
  var vendor, _req$body7, quantity, itemId, orderNumber, order, orderStatus, orderedItemIndex;

  return regeneratorRuntime.async(function _callee34$(_context51) {
    while (1) {
      switch (_context51.prev = _context51.next) {
        case 0:
          _context51.prev = 0;
          vendor = req.user._id;
          _req$body7 = req.body, quantity = _req$body7.quantity, itemId = _req$body7.itemId, orderNumber = _req$body7.orderNumber;
          console.log(quantity, itemId, orderNumber);

          if (!(!quantity || !itemId || !orderNumber)) {
            _context51.next = 6;
            break;
          }

          return _context51.abrupt("return", res.json({
            message: "All Fields are required!"
          }));

        case 6:
          _context51.next = 8;
          return regeneratorRuntime.awrap(UserOrder.findOne({
            orderNumber: orderNumber
          }));

        case 8:
          order = _context51.sent;

          if (order) {
            _context51.next = 11;
            break;
          }

          return _context51.abrupt("return", res.json({
            message: "Order not found!"
          }));

        case 11:
          _context51.next = 13;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            _id: order.orderStatus
          }));

        case 13:
          orderStatus = _context51.sent;

          if (!(orderStatus.status !== "Order Placed")) {
            _context51.next = 16;
            break;
          }

          return _context51.abrupt("return", res.json({
            message: "Not Authorized to change Quantity of orders in process!"
          }));

        case 16:
          // Find the index of the ordered item in the orderedItems array
          orderedItemIndex = order.orderedItems.findIndex(function (item) {
            return item.itemId.toString() === itemId;
          });

          if (!(orderedItemIndex === -1)) {
            _context51.next = 19;
            break;
          }

          return _context51.abrupt("return", res.json({
            message: "Item not found in order!"
          }));

        case 19:
          // Update the quantity of the ordered item
          order.orderedItems[orderedItemIndex].quantity = quantity; // Save the updated order back to the database

          _context51.next = 22;
          return regeneratorRuntime.awrap(order.save());

        case 22:
          console.log("fdghfh");
          return _context51.abrupt("return", res.json({
            message: "Quantity updated successfully!"
          }));

        case 26:
          _context51.prev = 26;
          _context51.t0 = _context51["catch"](0);
          console.log(_context51.t0, "errr");
          return _context51.abrupt("return", res.status(500).json({
            message: "Internal server error"
          }));

        case 30:
        case "end":
          return _context51.stop();
      }
    }
  }, null, null, [[0, 26]]);
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
  getAllOrdersbyHotel: getAllOrdersbyHotel,
  generateInvoice: generateInvoice,
  updateStock: updateStock,
  addItemToStock: addItemToStock,
  getVendorStocks: getVendorStocks,
  deleteItemFromStock: deleteItemFromStock,
  deleteHotelItem: deleteHotelItem,
  addHotelItem: addHotelItem,
  getHotelAssignableItems: getHotelAssignableItems,
  getVendorCategories: getVendorCategories,
  addStockItemOptions: addStockItemOptions,
  addVendorItem: addVendorItem,
  getAllVendorItems: getAllVendorItems,
  itemsForVendor: itemsForVendor,
  setVendorItemPrice: setVendorItemPrice,
  getVendorOrderAnalytics: getVendorOrderAnalytics,
  getItemAnalytics: getItemAnalytics,
  freshoCalculator: freshoCalculator,
  removeVendorItem: removeVendorItem,
  updateHotelItemProfit: updateHotelItemProfit,
  msgToSubVendor: msgToSubVendor,
  getAllPaymentPlans: getAllPaymentPlans,
  generatePlanToken: generatePlanToken,
  orderStatusUpdate: orderStatusUpdate,
  changeOrderQuantity: changeOrderQuantity
};