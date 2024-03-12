"use strict";

var ErrorHandler = require("../utils/errorhander.js");

var catchAsyncError = require("../middleware/catchAsyncErrors.js");

var _require = require("../dbClient.js"),
    getDatabase = _require.getDatabase;

var _require2 = require("mongodb"),
    ObjectId = _require2.ObjectId;

var Category = require("../models/category.js");

var Item = require("../models/item.js");

var Image = require("../models/image.js");

var itemImageS3 = require("../services/itemImageS3.js");

var HotelVendorLink = require("../models/hotelVendorLink.js");

var _require3 = require("../services/encryptionServices"),
    encrypt = _require3.encrypt,
    decrypt = _require3.decrypt;

var db = getDatabase();

var fs = require("fs");

var util = require("util");

var unlinkFile = util.promisify(fs.unlink);

var OrderStatus = require("../models/orderStatus.js");

var UserOrder = require("../models/order.js");

var Cart = require("../models/cart.js");

var User = require("../models/user.js");

var Role = require("../models/role.js");

var hotelItemPrice = require("../models/hotelItemPrice.js");

var addNewCategory = catchAsyncError(function _callee(req, res, next) {
  var name, createdBy, isActive, category;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          name = req.body.name;
          createdBy = req.user._id;
          isActive = true;

          if (name) {
            _context.next = 6;
            break;
          }

          throw new Error("Category Name is required.");

        case 6:
          category = new Category({
            name: name,
            createdBy: createdBy,
            isActive: isActive
          });
          _context.next = 9;
          return regeneratorRuntime.awrap(category.save());

        case 9:
          res.status(200).json({
            message: "Category Added"
          });
          _context.next = 15;
          break;

        case 12:
          _context.prev = 12;
          _context.t0 = _context["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 15:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 12]]);
});
var linkHoteltoVendor = catchAsyncError(function _callee2(req, res, next) {
  var _req$body, vendorId, hotelId, isActive, linkPresent, newLink;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body = req.body, vendorId = _req$body.vendorId, hotelId = _req$body.hotelId;
          isActive = true;

          if (!(!vendorId || !hotelId)) {
            _context2.next = 5;
            break;
          }

          throw new Error("HotelId and VendorId required.");

        case 5:
          _context2.next = 7;
          return regeneratorRuntime.awrap(HotelVendorLink.findOne({
            vendorId: new ObjectId(vendorId),
            hotelId: new Object(hotelId)
          }));

        case 7:
          linkPresent = _context2.sent;

          if (!linkPresent) {
            _context2.next = 12;
            break;
          }

          return _context2.abrupt("return", res.status(500).json({
            message: "Hotel already linked to vendor"
          }));

        case 12:
          newLink = new HotelVendorLink({
            vendorId: vendorId,
            hotelId: hotelId,
            isActive: isActive
          });
          _context2.next = 15;
          return regeneratorRuntime.awrap(newLink.save());

        case 15:
          res.status(200).json({
            message: "Hotel linked to vendor successfully."
          });

        case 16:
          _context2.next = 21;
          break;

        case 18:
          _context2.prev = 18;
          _context2.t0 = _context2["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 21:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 18]]);
});
var addNewItem = catchAsyncError(function _callee3(req, res, next) {
  var images, newItem, imagesReqBody, i, image, result, imageReqBody, itemImageReqBody, newImage;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          images = req.files;
          _context3.prev = 1;
          // Create a new item in MongoDB
          newItem = new Item({
            name: req.body.name,
            description: req.body.description,
            unit: req.body.unit,
            categoryId: req.body.categoryId
          });
          _context3.next = 5;
          return regeneratorRuntime.awrap(newItem.save());

        case 5:
          // Create a new image metadata entry in MongoDB
          imagesReqBody = [];
          i = 0;

        case 7:
          if (!(i < images.length)) {
            _context3.next = 20;
            break;
          }

          image = images[i];
          _context3.next = 11;
          return regeneratorRuntime.awrap(itemImageS3.uploadFile(image));

        case 11:
          result = _context3.sent;
          _context3.next = 14;
          return regeneratorRuntime.awrap(unlinkFile(image.path));

        case 14:
          if (image.fieldname == "image") isDisplayImage = true;
          imageReqBody = {
            imageLink: "/items/image/".concat(result.Key)
          }; // console.log(imageReqBody,result);

          imagesReqBody.push(imageReqBody);

        case 17:
          ++i;
          _context3.next = 7;
          break;

        case 20:
          itemImageReqBody = {
            img: imagesReqBody[0].imageLink,
            itemId: newItem._id
          };
          newImage = new Image(itemImageReqBody);
          _context3.next = 24;
          return regeneratorRuntime.awrap(newImage.save());

        case 24:
          res.status(201).json({
            message: "Item created successfully",
            item: newItem
          });
          _context3.next = 31;
          break;

        case 27:
          _context3.prev = 27;
          _context3.t0 = _context3["catch"](1);
          console.error(_context3.t0);
          res.status(500).json({
            message: "Internal server error"
          });

        case 31:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[1, 27]]);
});
var orderDetailById = catchAsyncError(function _callee4(req, res, next) {
  var orderId, orderData;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          orderId = req.body.orderId;
          console.log(req.body);
          _context4.next = 5;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              _id: new ObjectId(orderId)
            }
          }, {
            $lookup: {
              from: "orderstatuses",
              localField: "orderStatus",
              foreignField: "_id",
              as: "orderStatuses"
            }
          }, {
            $unwind: "$orderStatuses"
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
            $unwind: "$orderedItems.itemDetails.images"
          }, {
            $group: {
              _id: "$_id",
              hotelId: {
                $first: "$hotelId"
              },
              hotelDetails: {
                $first: "$hotelDetails"
              },
              orderNumber: {
                $first: "$orderNumber"
              },
              isReviewed: {
                $first: "$isReviewed"
              },
              orderStatuses: {
                $first: "$orderStatuses"
              },
              orderedItems: {
                $push: "$orderedItems"
              },
              isItemAdded: {
                $first: "$isItemAdded"
              },
              createdAt: {
                $first: "$createdAt"
              },
              updatedAt: {
                $first: "$updatedAt"
              }
            }
          }]));

        case 5:
          orderData = _context4.sent;
          res.status(200).json({
            orderData: orderData
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
var getAllOrders = catchAsyncError(function _callee5(req, res, next) {
  var orderData;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $lookup: {
              from: "orderstatuses",
              localField: "orderStatus",
              foreignField: "_id",
              as: "orderStatuses"
            }
          }, {
            $unwind: "$orderStatuses"
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
          }]));

        case 3:
          orderData = _context5.sent;
          res.status(200).json({
            orderData: orderData
          });
          _context5.next = 10;
          break;

        case 7:
          _context5.prev = 7;
          _context5.t0 = _context5["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 10:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
var getAllHotels = catchAsyncError(function _callee6(req, res, next) {
  var hotelRoleId, hotelData;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _context6.next = 3;
          return regeneratorRuntime.awrap(Role.findOne({
            name: "Hotel"
          }));

        case 3:
          hotelRoleId = _context6.sent;

          if (hotelRoleId) {
            _context6.next = 6;
            break;
          }

          return _context6.abrupt("return", res.status(404).json({
            error: "Role does not exist"
          }));

        case 6:
          _context6.next = 8;
          return regeneratorRuntime.awrap(User.aggregate([{
            $match: {
              roleId: new ObjectId(hotelRoleId)
            }
          }]));

        case 8:
          hotelData = _context6.sent;
          res.status(200).json({
            hotelData: hotelData
          });
          _context6.next = 15;
          break;

        case 12:
          _context6.prev = 12;
          _context6.t0 = _context6["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 15:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 12]]);
});
var getAllVendors = catchAsyncError(function _callee7(req, res, next) {
  var vendorRoleId, vendorData;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          _context7.next = 3;
          return regeneratorRuntime.awrap(Role.findOne({
            name: "Vendor"
          }));

        case 3:
          vendorRoleId = _context7.sent;

          if (vendorRoleId) {
            _context7.next = 6;
            break;
          }

          return _context7.abrupt("return", res.status(404).json({
            error: "Role does not exist"
          }));

        case 6:
          _context7.next = 8;
          return regeneratorRuntime.awrap(User.aggregate([{
            $match: {
              roleId: new ObjectId(vendorRoleId)
            }
          }]));

        case 8:
          vendorData = _context7.sent;
          res.status(200).json({
            vendorData: vendorData
          });
          _context7.next = 15;
          break;

        case 12:
          _context7.prev = 12;
          _context7.t0 = _context7["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 15:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 12]]);
});
var getAllItems = catchAsyncError(function _callee8(req, res, next) {
  var itemData;
  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return regeneratorRuntime.awrap(Item.aggregate([{
            $lookup: {
              from: "Images",
              localField: "_id",
              foreignField: "itemId",
              as: "images"
            }
          }, {
            $unwind: "$images"
          }, {
            $lookup: {
              from: "Category",
              localField: "categoryId",
              foreignField: "_id",
              as: "category"
            }
          }, {
            $unwind: "$category"
          }]));

        case 3:
          itemData = _context8.sent;
          res.status(200).json({
            itemData: itemData
          });
          _context8.next = 10;
          break;

        case 7:
          _context8.prev = 7;
          _context8.t0 = _context8["catch"](0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 10:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
var getHotelOrdersById = catchAsyncError(function _callee9(req, res, next) {
  var hotelId, orderData;
  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          hotelId = req.body.hotelId;
          _context9.next = 4;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              hotelId: new ObjectId(hotelId)
            }
          }, {
            $lookup: {
              from: "orderstatuses",
              localField: "orderStatus",
              foreignField: "_id",
              as: "orderStatuses"
            }
          }, {
            $unwind: "$orderStatuses"
          }]));

        case 4:
          orderData = _context9.sent;
          res.status(200).json({
            orderData: orderData
          });
          _context9.next = 12;
          break;

        case 8:
          _context9.prev = 8;
          _context9.t0 = _context9["catch"](0);
          console.log(_context9.t0);
          res.status(500).json({
            error: "Internal server error"
          });

        case 12:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var addUser = catchAsyncError(function _callee10(req, res, next) {
  var _req$body2, organization, fullName, email, phone, role, user, hashedPassword, userRole, newUser;

  return regeneratorRuntime.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          _req$body2 = req.body, organization = _req$body2.organization, fullName = _req$body2.fullName, email = _req$body2.email, phone = _req$body2.phone, role = _req$body2.role;

          if (!(!organization || !fullName || !email || !phone || !role)) {
            _context10.next = 4;
            break;
          }

          return _context10.abrupt("return", res.status(404).json({
            error: "All the Fields are Required"
          }));

        case 4:
          _context10.next = 6;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }));

        case 6:
          user = _context10.sent;

          if (!user) {
            _context10.next = 11;
            break;
          }

          return _context10.abrupt("return", res.status(400).json({
            success: false,
            error: "User already exists!"
          }));

        case 11:
          hashedPassword = encrypt("Freshopure123@");
          _context10.next = 14;
          return regeneratorRuntime.awrap(Role.findOne({
            name: role
          }));

        case 14:
          userRole = _context10.sent;
          newUser = new User({
            organization: organization,
            email: email,
            phone: phone,
            password: hashedPassword,
            fullName: fullName,
            roleId: userRole._id,
            isReviewed: true,
            reviewStatus: "approved"
          });
          _context10.next = 18;
          return regeneratorRuntime.awrap(newUser.save());

        case 18:
          res.status(200).json({
            success: true,
            user: newUser
          });

        case 19:
          _context10.next = 24;
          break;

        case 21:
          _context10.prev = 21;
          _context10.t0 = _context10["catch"](0);
          res.send(_context10.t0);

        case 24:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[0, 21]]);
});
var reviewUser = catchAsyncError(function _callee11(req, res, next) {
  var _req$body3, userId, status, user, editedUser;

  return regeneratorRuntime.async(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          _req$body3 = req.body, userId = _req$body3.userId, status = _req$body3.status;

          if (!(!status || !userId)) {
            _context11.next = 4;
            break;
          }

          return _context11.abrupt("return", res.status(404).json({
            error: "Status or userId not received"
          }));

        case 4:
          _context11.next = 6;
          return regeneratorRuntime.awrap(User.findOne({
            _id: userId
          }));

        case 6:
          user = _context11.sent;

          if (user) {
            _context11.next = 9;
            break;
          }

          return _context11.abrupt("return", res.status(404).json({
            error: "User not found"
          }));

        case 9:
          if (!(status.toLowerCase() === "approved")) {
            _context11.next = 15;
            break;
          }

          _context11.next = 12;
          return regeneratorRuntime.awrap(User.findOneAndUpdate({
            _id: userId
          }, {
            $set: {
              isApproved: "approved"
            }
          }, {
            returnDocument: "after"
          }));

        case 12:
          editedUser = _context11.sent;
          _context11.next = 19;
          break;

        case 15:
          if (!(status.toLowerCase() === "rejected")) {
            _context11.next = 19;
            break;
          }

          _context11.next = 18;
          return regeneratorRuntime.awrap(User.findOneAndUpdate({
            _id: userId
          }, {
            $set: {
              isApproved: "rejected"
            }
          }, {
            returnDocument: "after"
          }));

        case 18:
          editedUser = _context11.sent;

        case 19:
          res.status(201).json({
            editedUser: editedUser
          });
          _context11.next = 25;
          break;

        case 22:
          _context11.prev = 22;
          _context11.t0 = _context11["catch"](0);
          res.send(_context11.t0);

        case 25:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[0, 22]]);
});
var placeOrderByAdmin = catchAsyncError(function _callee12(req, res, next) {
  var _req$body4, HotelId, addressId, orderedItems, vendorId, orderStatusdoc, orderStatus, currentDate, formattedDate, randomNumber, orderNumber, order;

  return regeneratorRuntime.async(function _callee12$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          _context12.prev = 0;
          _req$body4 = req.body, HotelId = _req$body4.HotelId, addressId = _req$body4.addressId, orderedItems = _req$body4.orderedItems, vendorId = _req$body4.vendorId;

          if (!(!HotelId || !addressId || !orderedItems || !vendorId)) {
            _context12.next = 4;
            break;
          }

          return _context12.abrupt("return", res.status(404).json({
            error: "Please Enter all the required details"
          }));

        case 4:
          _context12.next = 6;
          return regeneratorRuntime.awrap(OrderStatus.find({
            status: "Order Placed"
          }));

        case 6:
          orderStatusdoc = _context12.sent;
          orderStatus = orderStatusdoc.map(function (status) {
            return status._id;
          });
          currentDate = new Date();
          formattedDate = currentDate.toISOString().substring(0, 10).replace(/-/g, "");
          randomNumber = Math.floor(Math.random() * 10000);
          orderNumber = "".concat(formattedDate, "-").concat(randomNumber);
          order = new UserOrder({
            vendorId: vendorId,
            hotelId: HotelId,
            orderNumber: orderNumber,
            orderStatus: orderStatus,
            addressId: addressId,
            orderedItems: orderedItems
          });
          _context12.next = 15;
          return regeneratorRuntime.awrap(order.save());

        case 15:
          res.send({
            order: order
          });
          _context12.next = 21;
          break;

        case 18:
          _context12.prev = 18;
          _context12.t0 = _context12["catch"](0);
          res.send(_context12.t0);

        case 21:
        case "end":
          return _context12.stop();
      }
    }
  }, null, null, [[0, 18]]);
});
var getAllCategories = catchAsyncError(function _callee13(req, res, next) {
  var category;
  return regeneratorRuntime.async(function _callee13$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          _context13.prev = 0;
          _context13.next = 3;
          return regeneratorRuntime.awrap(Category.find());

        case 3:
          category = _context13.sent;
          res.json({
            category: category
          });
          _context13.next = 10;
          break;

        case 7:
          _context13.prev = 7;
          _context13.t0 = _context13["catch"](0);
          res.json({
            error: _context13.t0
          });

        case 10:
        case "end":
          return _context13.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
var getHotelVendors = catchAsyncError(function _callee14(req, res, next) {
  var hotelId, vendors;
  return regeneratorRuntime.async(function _callee14$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          _context14.prev = 0;
          hotelId = req.params.hotelId;
          _context14.next = 4;
          return regeneratorRuntime.awrap(HotelVendorLink.aggregate([{
            $match: {
              hotelId: new ObjectId(hotelId)
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
          }]));

        case 4:
          vendors = _context14.sent;
          res.json({
            vendors: vendors
          });
          _context14.next = 11;
          break;

        case 8:
          _context14.prev = 8;
          _context14.t0 = _context14["catch"](0);
          res.json({
            error: _context14.t0
          });

        case 11:
        case "end":
          return _context14.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var getHotelOrders = catchAsyncError(function _callee15(req, res, next) {
  var hotelId, orders;
  return regeneratorRuntime.async(function _callee15$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
        case 0:
          _context15.prev = 0;
          hotelId = req.params.hotelId;
          _context15.next = 4;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              hotelId: new ObjectId(hotelId)
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
              from: "Users",
              localField: "hotelId",
              foreignField: "_id",
              as: "hotelDetails"
            }
          }, {
            $unwind: "$hotelDetails"
          }]));

        case 4:
          orders = _context15.sent;
          res.json({
            orders: orders
          });
          _context15.next = 11;
          break;

        case 8:
          _context15.prev = 8;
          _context15.t0 = _context15["catch"](0);
          res.json({
            error: _context15.t0
          });

        case 11:
        case "end":
          return _context15.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var getHotelItems = catchAsyncError(function _callee16(req, res, next) {
  var hotelId, items;
  return regeneratorRuntime.async(function _callee16$(_context16) {
    while (1) {
      switch (_context16.prev = _context16.next) {
        case 0:
          _context16.prev = 0;
          hotelId = req.params.hotelId;
          _context16.next = 4;
          return regeneratorRuntime.awrap(hotelItemPrice.aggregate([{
            $match: {
              hotelId: new ObjectId(hotelId)
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
              from: "Images",
              localField: "itemId",
              foreignField: "itemId",
              as: "images"
            }
          }, {
            $unwind: "$images"
          }, {
            $lookup: {
              from: "Category",
              localField: "categoryId",
              foreignField: "_id",
              as: "category"
            }
          }, {
            $unwind: "$category"
          }]));

        case 4:
          items = _context16.sent;
          res.json({
            items: items
          });
          _context16.next = 11;
          break;

        case 8:
          _context16.prev = 8;
          _context16.t0 = _context16["catch"](0);
          res.json({
            error: _context16.t0
          });

        case 11:
        case "end":
          return _context16.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var getVendorHotels = catchAsyncError(function _callee17(req, res, next) {
  var vendorId, hotels;
  return regeneratorRuntime.async(function _callee17$(_context17) {
    while (1) {
      switch (_context17.prev = _context17.next) {
        case 0:
          _context17.prev = 0;
          vendorId = req.params.vendorId;
          _context17.next = 4;
          return regeneratorRuntime.awrap(HotelVendorLink.aggregate([{
            $match: {
              vendorId: new ObjectId(vendorId)
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
          }]));

        case 4:
          hotels = _context17.sent;
          res.json({
            hotels: hotels
          });
          _context17.next = 11;
          break;

        case 8:
          _context17.prev = 8;
          _context17.t0 = _context17["catch"](0);
          res.json({
            error: _context17.t0
          });

        case 11:
        case "end":
          return _context17.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
var getVendorOrders = catchAsyncError(function _callee18(req, res, next) {
  var vendorId, orders;
  return regeneratorRuntime.async(function _callee18$(_context18) {
    while (1) {
      switch (_context18.prev = _context18.next) {
        case 0:
          _context18.prev = 0;
          vendorId = req.params.vendorId;
          console.log(vendorId);
          _context18.next = 5;
          return regeneratorRuntime.awrap(UserOrder.aggregate([{
            $match: {
              vendorId: new ObjectId(vendorId)
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
              from: "Users",
              localField: "hotelId",
              foreignField: "_id",
              as: "hotelDetails"
            }
          }, {
            $unwind: "$hotelDetails"
          }]));

        case 5:
          orders = _context18.sent;
          res.json(orders);
          _context18.next = 12;
          break;

        case 9:
          _context18.prev = 9;
          _context18.t0 = _context18["catch"](0);
          res.json({
            error: _context18.t0
          });

        case 12:
        case "end":
          return _context18.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
var getVendorItems = catchAsyncError(function _callee19(req, res, next) {
  var vendorId, items;
  return regeneratorRuntime.async(function _callee19$(_context19) {
    while (1) {
      switch (_context19.prev = _context19.next) {
        case 0:
          _context19.prev = 0;
          vendorId = req.params.vendorId;
          _context19.next = 4;
          return regeneratorRuntime.awrap(hotelItemPrice.aggregate([{
            $match: {
              vendorId: new ObjectId(vendorId)
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
              from: "Images",
              localField: "itemId",
              foreignField: "itemId",
              as: "images"
            }
          }, {
            $unwind: "$images"
          }, {
            $lookup: {
              from: "Category",
              localField: "categoryId",
              foreignField: "_id",
              as: "category"
            }
          }, {
            $unwind: "$category"
          }]));

        case 4:
          items = _context19.sent;
          res.json({
            items: items
          });
          _context19.next = 11;
          break;

        case 8:
          _context19.prev = 8;
          _context19.t0 = _context19["catch"](0);
          res.json({
            error: _context19.t0
          });

        case 11:
        case "end":
          return _context19.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
module.exports = {
  linkHoteltoVendor: linkHoteltoVendor,
  addNewCategory: addNewCategory,
  addNewItem: addNewItem,
  orderDetailById: orderDetailById,
  getAllOrders: getAllOrders,
  getAllHotels: getAllHotels,
  getAllVendors: getAllVendors,
  getAllItems: getAllItems,
  getHotelOrdersById: getHotelOrdersById,
  addUser: addUser,
  reviewUser: reviewUser,
  placeOrderByAdmin: placeOrderByAdmin,
  getAllCategories: getAllCategories,
  getHotelVendors: getHotelVendors,
  getHotelOrders: getHotelOrders,
  getHotelItems: getHotelItems,
  getVendorHotels: getVendorHotels,
  getVendorOrders: getVendorOrders,
  getVendorItems: getVendorItems
};