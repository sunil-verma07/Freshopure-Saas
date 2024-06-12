"use strict";

var ErrorHandler = require("../utils/errorhander.js");

var catchAsyncError = require("../middleware/catchAsyncErrors.js");

var _require = require("../dbClient.js"),
    getDatabase = _require.getDatabase;

var _require2 = require("mongodb"),
    ObjectId = _require2.ObjectId;

var collectionItems = require("../models/item.js");

var collectionImages = require("../models/image.js");

var db = getDatabase();
var hotels = db.collection("HotelItems");

var HotelItemPrice = require("../models/hotelItemPrice.js");

var category = require("../models/category.js");

var item = require("../models/item.js");

var OrderStatus = require("../models/orderStatus.js");

var VendorItems = require("../models/VendorItems.js");

var UserOrder = require("../models/order.js");

var Image = require("../models/image.js");

var getAllItemsForHotel = catchAsyncError(function _callee(req, res, next) {
  var categoryId, HotelId, data;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          categoryId = req.body.categoryId;
          HotelId = req.user._id;
          _context.next = 5;
          return regeneratorRuntime.awrap(HotelItemPrice.aggregate([{
            $match: {
              hotelId: HotelId,
              categoryId: new ObjectId(categoryId)
            }
          }, {
            $lookup: {
              from: "Items",
              localField: "itemId",
              foreignField: "_id",
              as: "itemDetails"
            }
          }, {
            $unwind: "$itemDetails"
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
              from: "Images",
              localField: "itemId",
              foreignField: "itemId",
              as: "itemDetails.image"
            }
          }, {
            $unwind: "$itemDetails.image"
          }]));

        case 5:
          data = _context.sent;
          res.status(200).json({
            data: data
          });
          _context.next = 12;
          break;

        case 9:
          _context.prev = 9;
          _context.t0 = _context["catch"](0);
          res.status(500).json({
            error: "Internal Server Error"
          });

        case 12:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
var myHotelProfile = catchAsyncError(function _callee2(req, res, next) {
  var userId, user;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          userId = req.user._id;
          _context2.next = 3;
          return regeneratorRuntime.awrap(User.findOne({
            _id: userId
          }).populate("roleId"));

        case 3:
          user = _context2.sent;

          if (user) {
            _context2.next = 8;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            success: false,
            error: "Unauthenticated User"
          }));

        case 8:
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            user: user
          }));

        case 9:
        case "end":
          return _context2.stop();
      }
    }
  });
});
var getAllCategories = catchAsyncError(function _callee3(req, res, next) {
  var categories;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(category.find());

        case 3:
          categories = _context3.sent;
          return _context3.abrupt("return", res.json({
            categories: categories
          }));

        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          return _context3.abrupt("return", res.json({
            message: "Internal Error"
          }));

        case 10:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
var getHotelOrderAnalytics = catchAsyncError(function _callee4(req, res, next) {
  var hotelId, duration, status, today, getLastWeekData, getLastMonthData, getLastSixMonthsData;
  return regeneratorRuntime.async(function _callee4$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          getLastSixMonthsData = function _ref3() {
            var result, _loop3, i;

            return regeneratorRuntime.async(function getLastSixMonthsData$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    result = []; // Loop through the last 6 months

                    _loop3 = function _loop3(i) {
                      var monthEnd, monthStart, orders, monthData;
                      return regeneratorRuntime.async(function _loop3$(_context6) {
                        while (1) {
                          switch (_context6.prev = _context6.next) {
                            case 0:
                              monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0); // End of the current month

                              monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1); // Start of the current month
                              // Find orders within the current month

                              _context6.next = 4;
                              return regeneratorRuntime.awrap(UserOrder.find({
                                hotelId: hotelId,
                                createdAt: {
                                  $gte: monthStart,
                                  $lte: monthEnd
                                },
                                orderStatus: {
                                  $ne: status._id
                                }
                              }));

                            case 4:
                              orders = _context6.sent;
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
                              return _context6.stop();
                          }
                        }
                      });
                    };

                    i = 0;

                  case 3:
                    if (!(i < 6)) {
                      _context7.next = 9;
                      break;
                    }

                    _context7.next = 6;
                    return regeneratorRuntime.awrap(_loop3(i));

                  case 6:
                    i++;
                    _context7.next = 3;
                    break;

                  case 9:
                    return _context7.abrupt("return", result.reverse());

                  case 10:
                  case "end":
                    return _context7.stop();
                }
              }
            });
          };

          getLastMonthData = function _ref2() {
            var result, monthEnd, monthStart, orders, _loop2, i;

            return regeneratorRuntime.async(function getLastMonthData$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    result = [];
                    monthEnd = new Date(today); // Month end is today

                    monthStart = new Date(today); // Month start is 30 days before today

                    monthStart.setDate(today.getDate() - 30); // Find orders within the last month

                    _context5.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      hotelId: hotelId,
                      createdAt: {
                        $gte: monthStart,
                        $lte: monthEnd
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context5.sent;

                    _loop2 = function _loop2(i) {
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
                      _loop2(i);
                    } // Return the result


                    return _context5.abrupt("return", result.reverse());

                  case 10:
                  case "end":
                    return _context5.stop();
                }
              }
            });
          };

          getLastWeekData = function _ref() {
            var result, weekEnd, weekStart, orders, daysOfWeek, _loop, i;

            return regeneratorRuntime.async(function getLastWeekData$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    result = [];
                    weekEnd = new Date(today);
                    weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - 6);
                    _context4.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      hotelId: hotelId,
                      createdAt: {
                        $gte: weekStart,
                        $lte: weekEnd
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context4.sent;
                    daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                    _loop = function _loop(i) {
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
                      _loop(i);
                    }

                    return _context4.abrupt("return", result);

                  case 11:
                  case "end":
                    return _context4.stop();
                }
              }
            });
          };

          hotelId = req.user._id;
          duration = req.body.duration;
          _context8.next = 7;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: "Cancelled"
          }));

        case 7:
          status = _context8.sent;
          today = new Date();

          if (!(duration === "week")) {
            _context8.next = 13;
            break;
          }

          return _context8.abrupt("return", getLastWeekData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 13:
          if (!(duration === "month")) {
            _context8.next = 17;
            break;
          }

          return _context8.abrupt("return", getLastMonthData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 17:
          if (!(duration === "sixMonths")) {
            _context8.next = 21;
            break;
          }

          return _context8.abrupt("return", getLastSixMonthsData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 21:
          return _context8.abrupt("return", res.status(404).json({
            error: "Incorrect duration selected"
          }));

        case 22:
        case "end":
          return _context8.stop();
      }
    }
  });
});
var getItemAnalytics = catchAsyncError(function _callee8(req, res, next) {
  var hotelId, duration, status, itemDetailsArray, getItemName, today, filterZeroQuantityItems, getLastWeekData, getLastMonthData, getLastSixMonthsData;
  return regeneratorRuntime.async(function _callee8$(_context16) {
    while (1) {
      switch (_context16.prev = _context16.next) {
        case 0:
          getLastSixMonthsData = function _ref6() {
            var result, sixMonthsAgo, startDate, endDate, orders, itemsList, itemDetails, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, _item3, obj, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, order, extraKg, info;

            return regeneratorRuntime.async(function getLastSixMonthsData$(_context15) {
              while (1) {
                switch (_context15.prev = _context15.next) {
                  case 0:
                    result = []; // Loop through the last 6 months

                    sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1); // Six months ago from the current month
                    // Calculate start and end dates for the six-month period

                    startDate = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1); // Start of the first month

                    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of the last month
                    // Find orders within the past six months

                    _context15.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      hotelId: hotelId,
                      createdAt: {
                        $gte: startDate,
                        $lte: endDate
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context15.sent;
                    _context15.next = 9;
                    return regeneratorRuntime.awrap(HotelItemPrice.find({
                      hotelId: hotelId
                    }));

                  case 9:
                    itemsList = _context15.sent;
                    itemDetails = itemsList.reduce(function (acc, item) {
                      acc[item.itemId] = {
                        itemId: item.itemId,
                        todayCostPrice: item.todayCostPrice,
                        orderedItems: []
                      };
                      return acc;
                    }, {}); // Iterate through orders and add ordered items details to itemDetails

                    orders.forEach(function (order) {
                      order.orderedItems.forEach(function _callee7(orderedItem) {
                        var itemId;
                        return regeneratorRuntime.async(function _callee7$(_context14) {
                          while (1) {
                            switch (_context14.prev = _context14.next) {
                              case 0:
                                itemId = orderedItem.itemId;

                                if (itemDetails[itemId]) {
                                  // If the item exists in itemDetails, add ordered item details to it
                                  itemDetails[itemId].orderedItems.push(orderedItem);
                                }

                              case 2:
                              case "end":
                                return _context14.stop();
                            }
                          }
                        });
                      });
                    });
                    itemDetailsArray = Object.values(itemDetails);
                    _iteratorNormalCompletion5 = true;
                    _didIteratorError5 = false;
                    _iteratorError5 = undefined;
                    _context15.prev = 16;
                    _iterator5 = itemDetailsArray[Symbol.iterator]();

                  case 18:
                    if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
                      _context15.next = 49;
                      break;
                    }

                    _item3 = _step5.value;
                    obj = {
                      totalQuantity: {
                        kg: 0,
                        gram: 0
                      },
                      totalPrice: 0
                    };
                    _iteratorNormalCompletion6 = true;
                    _didIteratorError6 = false;
                    _iteratorError6 = undefined;
                    _context15.prev = 24;

                    for (_iterator6 = _item3.orderedItems[Symbol.iterator](); !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                      order = _step6.value;
                      obj.totalQuantity.kg += order.quantity.kg;
                      obj.totalQuantity.gram += order.quantity.gram;

                      if (obj.totalQuantity.gram >= 1000) {
                        extraKg = Math.floor(obj.totalQuantity.gram / 1000); // Calculate extra kilograms

                        obj.totalQuantity.kg += extraKg; // Add extra kilograms

                        obj.totalQuantity.gram %= 1000; // Update grams to the remainder after conversion to kilograms
                      }

                      obj.totalPrice += order.quantity.kg * order.price + order.quantity.gram / 1000 * order.price;
                    }

                    _context15.next = 32;
                    break;

                  case 28:
                    _context15.prev = 28;
                    _context15.t0 = _context15["catch"](24);
                    _didIteratorError6 = true;
                    _iteratorError6 = _context15.t0;

                  case 32:
                    _context15.prev = 32;
                    _context15.prev = 33;

                    if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
                      _iterator6["return"]();
                    }

                  case 35:
                    _context15.prev = 35;

                    if (!_didIteratorError6) {
                      _context15.next = 38;
                      break;
                    }

                    throw _iteratorError6;

                  case 38:
                    return _context15.finish(35);

                  case 39:
                    return _context15.finish(32);

                  case 40:
                    _item3.orderedItems = obj;
                    _context15.next = 43;
                    return regeneratorRuntime.awrap(getItemName(_item3.itemId));

                  case 43:
                    info = _context15.sent;
                    _item3.name = info.name;
                    _item3.image = info.image;

                  case 46:
                    _iteratorNormalCompletion5 = true;
                    _context15.next = 18;
                    break;

                  case 49:
                    _context15.next = 55;
                    break;

                  case 51:
                    _context15.prev = 51;
                    _context15.t1 = _context15["catch"](16);
                    _didIteratorError5 = true;
                    _iteratorError5 = _context15.t1;

                  case 55:
                    _context15.prev = 55;
                    _context15.prev = 56;

                    if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
                      _iterator5["return"]();
                    }

                  case 58:
                    _context15.prev = 58;

                    if (!_didIteratorError5) {
                      _context15.next = 61;
                      break;
                    }

                    throw _iteratorError5;

                  case 61:
                    return _context15.finish(58);

                  case 62:
                    return _context15.finish(55);

                  case 63:
                    return _context15.abrupt("return", filterZeroQuantityItems(itemDetailsArray));

                  case 64:
                  case "end":
                    return _context15.stop();
                }
              }
            }, null, null, [[16, 51, 55, 63], [24, 28, 32, 40], [33,, 35, 39], [56,, 58, 62]]);
          };

          getLastMonthData = function _ref5() {
            var result, monthEnd, monthStart, orders, itemsList, itemDetails, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, _item2, obj, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, order, info;

            return regeneratorRuntime.async(function getLastMonthData$(_context13) {
              while (1) {
                switch (_context13.prev = _context13.next) {
                  case 0:
                    result = [];
                    monthEnd = new Date(today); // Month end is today

                    monthStart = new Date(today); // Month start is 30 days before today

                    monthStart.setDate(today.getDate() - 30); // Find orders within the last month

                    _context13.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      hotelId: hotelId,
                      createdAt: {
                        $gte: monthStart,
                        $lte: monthEnd
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context13.sent;
                    _context13.next = 9;
                    return regeneratorRuntime.awrap(HotelItemPrice.find({
                      hotelId: hotelId
                    }));

                  case 9:
                    itemsList = _context13.sent;
                    itemDetails = itemsList.reduce(function (acc, item) {
                      acc[item.itemId] = {
                        itemId: item.itemId,
                        todayCostPrice: item.todayCostPrice,
                        orderedItems: []
                      };
                      return acc;
                    }, {}); // Iterate through orders and add ordered items details to itemDetails

                    orders.forEach(function (order) {
                      order.orderedItems.forEach(function _callee6(orderedItem) {
                        var itemId;
                        return regeneratorRuntime.async(function _callee6$(_context12) {
                          while (1) {
                            switch (_context12.prev = _context12.next) {
                              case 0:
                                itemId = orderedItem.itemId;

                                if (itemDetails[itemId]) {
                                  // If the item exists in itemDetails, add ordered item details to it
                                  itemDetails[itemId].orderedItems.push(orderedItem);
                                }

                              case 2:
                              case "end":
                                return _context12.stop();
                            }
                          }
                        });
                      });
                    });
                    itemDetailsArray = Object.values(itemDetails);
                    _iteratorNormalCompletion3 = true;
                    _didIteratorError3 = false;
                    _iteratorError3 = undefined;
                    _context13.prev = 16;
                    _iterator3 = itemDetailsArray[Symbol.iterator]();

                  case 18:
                    if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
                      _context13.next = 49;
                      break;
                    }

                    _item2 = _step3.value;
                    obj = {
                      totalQuantity: {
                        kg: 0,
                        gram: 0
                      },
                      totalPrice: 0
                    };
                    _iteratorNormalCompletion4 = true;
                    _didIteratorError4 = false;
                    _iteratorError4 = undefined;
                    _context13.prev = 24;

                    for (_iterator4 = _item2.orderedItems[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                      order = _step4.value;
                      obj.totalQuantity.kg += order.quantity.kg;
                      obj.totalQuantity.gram += order.quantity.gram;
                      obj.totalPrice += order.quantity.kg * order.price + order.quantity.gram / 1000 * order.price;
                    }

                    _context13.next = 32;
                    break;

                  case 28:
                    _context13.prev = 28;
                    _context13.t0 = _context13["catch"](24);
                    _didIteratorError4 = true;
                    _iteratorError4 = _context13.t0;

                  case 32:
                    _context13.prev = 32;
                    _context13.prev = 33;

                    if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
                      _iterator4["return"]();
                    }

                  case 35:
                    _context13.prev = 35;

                    if (!_didIteratorError4) {
                      _context13.next = 38;
                      break;
                    }

                    throw _iteratorError4;

                  case 38:
                    return _context13.finish(35);

                  case 39:
                    return _context13.finish(32);

                  case 40:
                    _item2.orderedItems = obj;
                    _context13.next = 43;
                    return regeneratorRuntime.awrap(getItemName(_item2.itemId));

                  case 43:
                    info = _context13.sent;
                    _item2.name = info.name;
                    _item2.image = info.image;

                  case 46:
                    _iteratorNormalCompletion3 = true;
                    _context13.next = 18;
                    break;

                  case 49:
                    _context13.next = 55;
                    break;

                  case 51:
                    _context13.prev = 51;
                    _context13.t1 = _context13["catch"](16);
                    _didIteratorError3 = true;
                    _iteratorError3 = _context13.t1;

                  case 55:
                    _context13.prev = 55;
                    _context13.prev = 56;

                    if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
                      _iterator3["return"]();
                    }

                  case 58:
                    _context13.prev = 58;

                    if (!_didIteratorError3) {
                      _context13.next = 61;
                      break;
                    }

                    throw _iteratorError3;

                  case 61:
                    return _context13.finish(58);

                  case 62:
                    return _context13.finish(55);

                  case 63:
                    return _context13.abrupt("return", filterZeroQuantityItems(itemDetailsArray));

                  case 64:
                  case "end":
                    return _context13.stop();
                }
              }
            }, null, null, [[16, 51, 55, 63], [24, 28, 32, 40], [33,, 35, 39], [56,, 58, 62]]);
          };

          getLastWeekData = function _ref4() {
            var result, weekEnd, weekStart, orders, itemsList, itemDetails, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _item, obj, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, order, info;

            return regeneratorRuntime.async(function getLastWeekData$(_context11) {
              while (1) {
                switch (_context11.prev = _context11.next) {
                  case 0:
                    result = [];
                    weekEnd = new Date(today);
                    weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - 6);
                    _context11.next = 6;
                    return regeneratorRuntime.awrap(UserOrder.find({
                      hotelId: hotelId,
                      createdAt: {
                        $gte: weekStart,
                        $lte: weekEnd
                      },
                      orderStatus: {
                        $ne: status._id
                      }
                    }));

                  case 6:
                    orders = _context11.sent;
                    _context11.next = 9;
                    return regeneratorRuntime.awrap(HotelItemPrice.find({
                      hotelId: hotelId
                    }));

                  case 9:
                    itemsList = _context11.sent;
                    itemDetails = itemsList.reduce(function (acc, item) {
                      acc[item.itemId] = {
                        itemId: item.itemId,
                        todayCostPrice: item.todayCostPrice,
                        orderedItems: []
                      };
                      return acc;
                    }, {}); // Iterate through orders and add ordered items details to itemDetails

                    orders.forEach(function (order) {
                      order.orderedItems.forEach(function _callee5(orderedItem) {
                        var itemId;
                        return regeneratorRuntime.async(function _callee5$(_context10) {
                          while (1) {
                            switch (_context10.prev = _context10.next) {
                              case 0:
                                itemId = orderedItem.itemId;

                                if (itemDetails[itemId]) {
                                  // If the item exists in itemDetails, add ordered item details to it
                                  itemDetails[itemId].orderedItems.push(orderedItem);
                                }

                              case 2:
                              case "end":
                                return _context10.stop();
                            }
                          }
                        });
                      });
                    });
                    itemDetailsArray = Object.values(itemDetails);
                    _iteratorNormalCompletion = true;
                    _didIteratorError = false;
                    _iteratorError = undefined;
                    _context11.prev = 16;
                    _iterator = itemDetailsArray[Symbol.iterator]();

                  case 18:
                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                      _context11.next = 49;
                      break;
                    }

                    _item = _step.value;
                    obj = {
                      totalQuantity: {
                        kg: 0,
                        gram: 0
                      },
                      totalPrice: 0
                    };
                    _iteratorNormalCompletion2 = true;
                    _didIteratorError2 = false;
                    _iteratorError2 = undefined;
                    _context11.prev = 24;

                    for (_iterator2 = _item.orderedItems[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      order = _step2.value;
                      obj.totalQuantity.kg += order.quantity.kg;
                      obj.totalQuantity.gram += order.quantity.gram;
                      obj.totalPrice += order.quantity.kg * order.price + order.quantity.gram / 1000 * order.price;
                    }

                    _context11.next = 32;
                    break;

                  case 28:
                    _context11.prev = 28;
                    _context11.t0 = _context11["catch"](24);
                    _didIteratorError2 = true;
                    _iteratorError2 = _context11.t0;

                  case 32:
                    _context11.prev = 32;
                    _context11.prev = 33;

                    if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                      _iterator2["return"]();
                    }

                  case 35:
                    _context11.prev = 35;

                    if (!_didIteratorError2) {
                      _context11.next = 38;
                      break;
                    }

                    throw _iteratorError2;

                  case 38:
                    return _context11.finish(35);

                  case 39:
                    return _context11.finish(32);

                  case 40:
                    _item.orderedItems = obj; // console.log(item, "item");

                    _context11.next = 43;
                    return regeneratorRuntime.awrap(getItemName(_item.itemId));

                  case 43:
                    info = _context11.sent;
                    _item.name = info.name;
                    _item.image = info.image;

                  case 46:
                    _iteratorNormalCompletion = true;
                    _context11.next = 18;
                    break;

                  case 49:
                    _context11.next = 55;
                    break;

                  case 51:
                    _context11.prev = 51;
                    _context11.t1 = _context11["catch"](16);
                    _didIteratorError = true;
                    _iteratorError = _context11.t1;

                  case 55:
                    _context11.prev = 55;
                    _context11.prev = 56;

                    if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                      _iterator["return"]();
                    }

                  case 58:
                    _context11.prev = 58;

                    if (!_didIteratorError) {
                      _context11.next = 61;
                      break;
                    }

                    throw _iteratorError;

                  case 61:
                    return _context11.finish(58);

                  case 62:
                    return _context11.finish(55);

                  case 63:
                    return _context11.abrupt("return", filterZeroQuantityItems(itemDetailsArray));

                  case 64:
                  case "end":
                    return _context11.stop();
                }
              }
            }, null, null, [[16, 51, 55, 63], [24, 28, 32, 40], [33,, 35, 39], [56,, 58, 62]]);
          };

          hotelId = req.user._id;
          duration = req.body.duration;
          _context16.next = 7;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: "Cancelled"
          }));

        case 7:
          status = _context16.sent;
          itemDetailsArray = [];

          getItemName = function getItemName(itemId) {
            var items, image, itemObj;
            return regeneratorRuntime.async(function getItemName$(_context9) {
              while (1) {
                switch (_context9.prev = _context9.next) {
                  case 0:
                    _context9.next = 2;
                    return regeneratorRuntime.awrap(item.findOne({
                      _id: itemId
                    }));

                  case 2:
                    items = _context9.sent;
                    _context9.next = 5;
                    return regeneratorRuntime.awrap(Image.findOne({
                      itemId: itemId
                    }));

                  case 5:
                    image = _context9.sent;
                    // console.log(items, image);
                    itemObj = {
                      name: items.name,
                      image: image.img
                    };
                    return _context9.abrupt("return", itemObj);

                  case 8:
                  case "end":
                    return _context9.stop();
                }
              }
            });
          };

          today = new Date();

          filterZeroQuantityItems = function filterZeroQuantityItems(itemsArray) {
            return itemsArray.filter(function (item) {
              return item.orderedItems.totalQuantity.kg > 0 || item.orderedItems.totalQuantity.gram > 0;
            });
          };

          if (!(duration === "week")) {
            _context16.next = 16;
            break;
          }

          return _context16.abrupt("return", getLastWeekData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 16:
          if (!(duration === "month")) {
            _context16.next = 20;
            break;
          }

          return _context16.abrupt("return", getLastMonthData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 20:
          if (!(duration === "sixMonths")) {
            _context16.next = 24;
            break;
          }

          return _context16.abrupt("return", getLastSixMonthsData(today).then(function (data) {
            return res.status(200).json({
              data: data
            });
          })["catch"](function (err) {
            return console.log(err);
          }));

        case 24:
          return _context16.abrupt("return", res.status(404).json({
            error: "Incorrect duration selected"
          }));

        case 25:
        case "end":
          return _context16.stop();
      }
    }
  });
});
var totalSales = catchAsyncError(function _callee9(req, res, next) {
  var hotel, _status, _orders, total;

  return regeneratorRuntime.async(function _callee9$(_context17) {
    while (1) {
      switch (_context17.prev = _context17.next) {
        case 0:
          _context17.prev = 0;
          hotel = req.user._id;
          _context17.next = 4;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: "Delivered"
          }));

        case 4:
          _status = _context17.sent;
          _context17.next = 7;
          return regeneratorRuntime.awrap(UserOrder.find({
            hotelId: hotel,
            orderStatus: _status._id
          }));

        case 7:
          _orders = _context17.sent;
          // console.log(hotel);
          total = 0;

          _orders.map(function (order) {
            // console.log(order, "orderr");
            total += order.totalPrice;
          }); // console.log(total, "total");


          return _context17.abrupt("return", res.json({
            sales: total
          }));

        case 13:
          _context17.prev = 13;
          _context17.t0 = _context17["catch"](0);
          console.log(_context17.t0, "errr");
          return _context17.abrupt("return", res.status(500).json({
            message: "Internal server error"
          }));

        case 17:
        case "end":
          return _context17.stop();
      }
    }
  }, null, null, [[0, 13]]);
});
module.exports = {
  getAllItemsForHotel: getAllItemsForHotel,
  myHotelProfile: myHotelProfile,
  getAllCategories: getAllCategories,
  getHotelOrderAnalytics: getHotelOrderAnalytics,
  getItemAnalytics: getItemAnalytics,
  totalSales: totalSales
};