"use strict";

var ErrorHandler = require("../utils/errorhander.js");

var catchAsyncError = require("../middleware/catchAsyncErrors.js");

var _require = require("../dbClient.js"),
    getDatabase = _require.getDatabase;

var _require2 = require("mongodb"),
    ObjectId = _require2.ObjectId;

var UserOrder = require("../models/order.js");

var Cart = require("../models/cart.js");

var db = getDatabase(); // const UserOrder = db.collection('UserOrders');

var OrderStatus = require("../models/orderStatus.js");

var itemsPrice = require("../models/cart.js");

var Items = require("../models/item.js");

var Images = require("../models/image.js");

var Address = require("../models/address.js");

var UserItems = db.collection("UserItems");

var HotelItemPrice = require("../models/hotelItemPrice.js");

var Addresses = require("../models/address.js");

var category = require("../models/category.js");

var item = require("../models/item.js");

var placeOrder = catchAsyncError(function _callee2(req, res, next) {
  var hotelId, address, orderStatus, cart_doc, orders, totalOrderPrice, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _item, itemPrice, updatedItem, vendorId;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          hotelId = req.user._id; //order address

          _context2.next = 4;
          return regeneratorRuntime.awrap(Addresses.findOne({
            HotelId: hotelId,
            selected: true
          }));

        case 4:
          address = _context2.sent;

          if (address) {
            _context2.next = 7;
            break;
          }

          throw new Error("Address not found");

        case 7:
          //order status
          orderStatus = "65cef0c27ebbb69ab54c55f4"; //cart items

          _context2.next = 10;
          return regeneratorRuntime.awrap(Cart.findOne({
            hotelId: hotelId
          }));

        case 10:
          cart_doc = _context2.sent;
          console.log(cart_doc, hotelId, "abcd");
          orders = {};
          totalOrderPrice = 0;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context2.prev = 17;
          _iterator = cart_doc.cartItems[Symbol.iterator]();

        case 19:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context2.next = 33;
            break;
          }

          _item = _step.value;
          _context2.next = 23;
          return regeneratorRuntime.awrap(HotelItemPrice.findOne({
            vendorId: _item.vendorId,
            itemId: _item.itemId,
            hotelId: hotelId
          }));

        case 23:
          itemPrice = _context2.sent;

          if (itemPrice) {
            _context2.next = 27;
            break;
          }

          console.log("Hotel item price not found for item:", _item);
          return _context2.abrupt("continue", 30);

        case 27:
          updatedItem = {
            vendorId: _item.vendorId,
            itemId: _item.itemId,
            quantity: _item.quantity,
            price: itemPrice.todayCostPrice
          };

          if (!orders[_item.vendorId]) {
            orders[_item.vendorId] = [];
          }

          orders[_item.vendorId].push(updatedItem);

        case 30:
          _iteratorNormalCompletion = true;
          _context2.next = 19;
          break;

        case 33:
          _context2.next = 39;
          break;

        case 35:
          _context2.prev = 35;
          _context2.t0 = _context2["catch"](17);
          _didIteratorError = true;
          _iteratorError = _context2.t0;

        case 39:
          _context2.prev = 39;
          _context2.prev = 40;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 42:
          _context2.prev = 42;

          if (!_didIteratorError) {
            _context2.next = 45;
            break;
          }

          throw _iteratorError;

        case 45:
          return _context2.finish(42);

        case 46:
          return _context2.finish(39);

        case 47:
          console.log(totalOrderPrice, "cost");
          _context2.t1 = regeneratorRuntime.keys(orders);

        case 49:
          if ((_context2.t2 = _context2.t1()).done) {
            _context2.next = 56;
            break;
          }

          vendorId = _context2.t2.value;

          if (!Object.hasOwnProperty.call(orders, vendorId)) {
            _context2.next = 54;
            break;
          }

          _context2.next = 54;
          return regeneratorRuntime.awrap(function _callee() {
            var items, currentDate, formattedDate, randomNumber, orderNumber, totalPrice, order;
            return regeneratorRuntime.async(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    items = orders[vendorId]; //order Number

                    currentDate = new Date();
                    formattedDate = currentDate.toISOString().substring(0, 10).replace(/-/g, "");
                    randomNumber = Math.floor(Math.random() * 10000);
                    orderNumber = "".concat(formattedDate, "-").concat(randomNumber);
                    totalPrice = 0;
                    items.forEach(function (item) {
                      if (item.quantity.kg === 0 && item.quantity.gram < 100) {
                        return res.status(400).json({
                          message: "Quantity must be greater than 100 gm."
                        });
                      }

                      var totalGrams = item.quantity.kg * 1000 + item.quantity.gram; // Convert kg to grams and add the gram value

                      totalPrice = totalPrice + totalGrams * item.price / 1000; // Multiply total grams with price and store in totalPrice field
                    });
                    order = new UserOrder({
                      vendorId: vendorId,
                      hotelId: hotelId,
                      orderNumber: orderNumber,
                      orderStatus: orderStatus,
                      totalPrice: totalPrice,
                      address: address,
                      orderedItems: items
                    });
                    console.log(order, "order");
                    _context.next = 11;
                    return regeneratorRuntime.awrap(order.save());

                  case 11:
                  case "end":
                    return _context.stop();
                }
              }
            });
          }());

        case 54:
          _context2.next = 49;
          break;

        case 56:
          _context2.next = 58;
          return regeneratorRuntime.awrap(Cart.deleteOne({
            hotelId: new ObjectId(hotelId)
          }));

        case 58:
          res.status(200).json({
            message: "Order Placed",
            orders: orders
          });
          _context2.next = 66;
          break;

        case 61:
          _context2.prev = 61;
          _context2.t3 = _context2["catch"](0);
          console.log(_context2.t3);

          if (_context2.t3.message == "Both addressId and price are required fields.") {
            res.status(400).json({
              error: _context2.t3.message
            });
          }

          res.status(500).json({
            error: "Internal server error"
          });

        case 66:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 61], [17, 35, 39, 47], [40,, 42, 46]]);
});
var orderHistory = catchAsyncError(function _callee3(req, res, next) {
  var hotelId, pageSize, _req$body, offset, status, statusId, orderData;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          hotelId = req.user._id;
          pageSize = 7;
          _req$body = req.body, offset = _req$body.offset, status = _req$body.status; // console.log(req);

          console.log(offset, status, "offset");
          _context3.next = 7;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: status
          }));

        case 7:
          statusId = _context3.sent;
          _context3.next = 10;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              hotelId: hotelId,
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
            $unwind: "$orderedItems" // Unwind orderedItems array

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
              // orderData: { $first: "$$ROOT" },
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
              // orderData: 1,
              orderedItems: 1
            }
          }, {
            $skip: offset
          }, {
            $limit: parseInt(pageSize)
          }]));

        case 10:
          orderData = _context3.sent;
          console.log(orderData, "order");
          res.status(200).json({
            status: "success message",
            data: orderData
          });
          _context3.next = 18;
          break;

        case 15:
          _context3.prev = 15;
          _context3.t0 = _context3["catch"](0);
          next(_context3.t0);

        case 18:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 15]]);
});
var allHotelOrders = catchAsyncError(function _callee4(req, res, next) {
  var hotelId, hotelOrders;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          hotelId = req.user._id;
          _context4.next = 4;
          return regeneratorRuntime.awrap(UserOrder.find({
            hotelId: hotelId
          }).populate("orderStatus"));

        case 4:
          hotelOrders = _context4.sent;
          res.status(200).json({
            hotelOrders: hotelOrders
          });
          _context4.next = 11;
          break;

        case 8:
          _context4.prev = 8;
          _context4.t0 = _context4["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 11:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var orderAgain = catchAsyncError(function _callee5(req, res, next) {
  var UserId, _req$body2, order_id, addressId, findOrder, orderedItems, cartPresent, x, cart;

  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          UserId = req.hotel._id;
          _req$body2 = req.body, order_id = _req$body2.order_id, addressId = _req$body2.addressId;

          if (!(!addressId || !order_id)) {
            _context5.next = 5;
            break;
          }

          throw new Error("Both addressId and order_id are required fields.");

        case 5:
          _context5.next = 7;
          return regeneratorRuntime.awrap(UserOrder.findOne({
            _id: new ObjectId(order_id)
          }));

        case 7:
          findOrder = _context5.sent;

          if (!findOrder) {
            _context5.next = 25;
            break;
          }

          orderedItems = findOrder.orderedItems[0];
          _context5.next = 12;
          return regeneratorRuntime.awrap(Cart.findOne({
            UserId: new ObjectId(UserId)
          }));

        case 12:
          cartPresent = _context5.sent;

          if (!cartPresent) {
            _context5.next = 19;
            break;
          }

          _context5.next = 16;
          return regeneratorRuntime.awrap(Cart.updateOne({
            UserId: new ObjectId(UserId)
          }, {
            $set: {
              orderedItems: orderedItems
            }
          }));

        case 16:
          x = _context5.sent;
          _context5.next = 22;
          break;

        case 19:
          cart = new Cart({
            UserId: UserId,
            orderedItems: orderedItems
          }); // Save the cart to the database

          _context5.next = 22;
          return regeneratorRuntime.awrap(cart.save());

        case 22:
          res.status(200).json({
            message: "Order Items Added To cart"
          });
          _context5.next = 26;
          break;

        case 25:
          res.status(400).json({
            error: "Order Not Found"
          });

        case 26:
          _context5.next = 31;
          break;

        case 28:
          _context5.prev = 28;
          _context5.t0 = _context5["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 31:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 28]]);
});
var compiledOrderForHotel = catchAsyncError(function _callee6(req, res, next) {
  var callApi, UserId;
  return regeneratorRuntime.async(function _callee6$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          try {
            // const { itemId } = req.body;
            // if (!itemId) {
            //   throw new Error('itemId is required fields.');
            // }
            // const data =null;
            callApi = function callApi(UserId, callback) {
              var reqBody;
              return regeneratorRuntime.async(function callApi$(_context6) {
                while (1) {
                  switch (_context6.prev = _context6.next) {
                    case 0:
                      reqBody = {
                        UserId: UserId
                      };
                      fetch("https://ap-south-1.aws.data.mongodb-api.com/app/letusfarm-fuadi/endpoint/compiledOrderForHotelsecret=alwaysShine", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json" // 'Content-Type': 'application/x-www-form-urlencoded',

                        },
                        body: JSON.stringify(reqBody)
                      }).then(function (response) {
                        return response.json();
                      }).then(function (data) {
                        // console.log('Request succeeded with JSON response', data);
                        return callback(null, data);
                      })["catch"](function (error) {
                        console.log("Request failed", error);
                        return callback(error);
                      });

                    case 2:
                    case "end":
                      return _context6.stop();
                  }
                }
              });
            };

            UserId = req.hotel._id;
            callApi(UserId, function (error, data) {
              if (error) {
                throw new Error(error);
              } else {
                return res.status(200).json({
                  success: true,
                  data: data
                });
              }
            }); // res.status(200).json(data);
          } catch (error) {
            res.status(500).json({
              error: "Internal server error"
            });
          }

        case 1:
        case "end":
          return _context7.stop();
      }
    }
  });
});
var orderDetails = catchAsyncError(function _callee7(req, res, next) {
  var orderId, orderData;
  return regeneratorRuntime.async(function _callee7$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          orderId = req.body.orderId;
          _context8.next = 4;
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
            $unwind: "$orderedItems"
          }, {
            $lookup: {
              from: "Items",
              localField: "orderedItems.itemId",
              foreignField: "_id",
              as: "orderedItems.itemDetails"
            }
          }, {
            $unwind: "$orderedItems.itemDetails"
          }, {
            $lookup: {
              from: "Images",
              localField: "orderedItems.itemDetails._id",
              foreignField: "itemId",
              as: "orderedItems.itemDetails.images"
            }
          }, {
            $unwind: {
              path: "$orderedItems.itemDetails.images",
              preserveNullAndEmptyArrays: true // Preserve documents without images

            }
          }, {
            $group: {
              _id: "$_id",
              orderStatus: {
                $first: "$orderStatus"
              },
              orderedItems: {
                $push: "$orderedItems"
              }
            }
          }]));

        case 4:
          orderData = _context8.sent;
          return _context8.abrupt("return", res.status(200).json({
            success: true,
            data: orderData
          }));

        case 8:
          _context8.prev = 8;
          _context8.t0 = _context8["catch"](0);
          console.log(_context8.t0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 12:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var cancelOrder = catchAsyncError(function _callee8(req, res, next) {
  var hotelId, orderNumber, order, createdAtDate, currentDate, isSameDay, status, updatedOrder, orderData;
  return regeneratorRuntime.async(function _callee8$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          hotelId = req.user._id.hotelId;
          orderNumber = req.body.orderNumber; // Check if the order can be canceled

          _context9.next = 5;
          return regeneratorRuntime.awrap(UserOrder.findOne({
            orderNumber: orderNumber
          }));

        case 5:
          order = _context9.sent;
          createdAtDate = new Date(order.createdAt);
          currentDate = new Date(); // Check if the order was placed on the same day as the current date

          isSameDay = createdAtDate.getDate() === currentDate.getDate() && createdAtDate.getMonth() === currentDate.getMonth() && createdAtDate.getFullYear() === currentDate.getFullYear(); // If the conditions are not met, return an error response

          if (isSameDay) {
            _context9.next = 11;
            break;
          }

          return _context9.abrupt("return", res.status(400).json({
            error: "Cannot cancel order after midnight."
          }));

        case 11:
          _context9.next = 13;
          return regeneratorRuntime.awrap(OrderStatus.findOne({
            status: "Cancelled"
          }));

        case 13:
          status = _context9.sent;
          _context9.next = 16;
          return regeneratorRuntime.awrap(UserOrder.findOneAndUpdate({
            orderNumber: orderNumber
          }, {
            $set: {
              orderStatus: status._id
            }
          }, {
            "new": true
          } // Return the updated document
          ));

        case 16:
          updatedOrder = _context9.sent;

          if (updatedOrder) {
            _context9.next = 19;
            break;
          }

          return _context9.abrupt("return", res.status(404).json({
            error: "Order not found."
          }));

        case 19:
          _context9.next = 21;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              hotelId: hotelId
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
            $unwind: "$orderedItems" // Unwind orderedItems array

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
              // orderData: { $first: "$$ROOT" },
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
              _id: 0,
              hotelId: 1,
              vendorDetails: 1,
              orderNumber: 1,
              isReviewed: 1,
              totalPrice: 1,
              address: 1,
              createdAt: 1,
              updatedAt: 1,
              orderStatusDetails: 1,
              // orderData: 1,
              orderedItems: 1
            }
          }]));

        case 21:
          orderData = _context9.sent;
          console.log(orderData);
          return _context9.abrupt("return", res.status(200).json({
            success: true,
            message: "Order Cancelled!",
            data: orderData
          }));

        case 26:
          _context9.prev = 26;
          _context9.t0 = _context9["catch"](0);
          console.log(_context9.t0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 30:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 26]]);
});

function orderHistoryForHotel(hotelId) {
  var orderData;
  return regeneratorRuntime.async(function orderHistoryForHotel$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          _context10.next = 3;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              hotelId: hotelId
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
            $unwind: "$orderedItems" // Unwind orderedItems array

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
              // orderData: { $first: "$$ROOT" },
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
              _id: 0,
              hotelId: 1,
              vendorDetails: 1,
              orderNumber: 1,
              isReviewed: 1,
              totalPrice: 1,
              address: 1,
              createdAt: 1,
              updatedAt: 1,
              orderStatusDetails: 1,
              // orderData: 1,
              orderedItems: 1
            }
          }]));

        case 3:
          orderData = _context10.sent;
          console.log(orderData);
          return _context10.abrupt("return", orderData);

        case 8:
          _context10.prev = 8;
          _context10.t0 = _context10["catch"](0);
          console.log(_context10.t0);

        case 11:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[0, 8]]);
}

module.exports = {
  placeOrder: placeOrder,
  orderHistory: orderHistory,
  orderAgain: orderAgain,
  compiledOrderForHotel: compiledOrderForHotel,
  orderDetails: orderDetails,
  allHotelOrders: allHotelOrders,
  cancelOrder: cancelOrder
};