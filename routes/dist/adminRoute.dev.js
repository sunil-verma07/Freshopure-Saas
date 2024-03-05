"use strict";

var express = require("express");

var router = express.Router();

var authMiddleware = require("../middleware/auth");

var _require = require("../services/imageService.js"),
    upload = _require.upload; // const profileCompleteMiddleware = require('../middleware/profileComplete.js')


var admincontroller = require("../controllers/AdminController.js");

router.post("/addnewcategory", authMiddleware.isAuthenticatedUser, admincontroller.addNewCategory);
router.post("/vendorhotellink", authMiddleware.isAuthenticatedUser, admincontroller.linkHoteltoVendor);
router.post("/orderDetailById", authMiddleware.isAuthenticatedUser, admincontroller.orderDetailById);
router.post("/addnewitem", authMiddleware.isAuthenticatedUser, upload.any(), admincontroller.addNewItem);
router.get("/allOrders", authMiddleware.isAuthenticatedUser, admincontroller.getAllOrders);
router.get("/allHotels", admincontroller.getAllHotels);
router.get("/allVendors", authMiddleware.isAuthenticatedUser, admincontroller.getAllVendors);
router.get("/allItems", authMiddleware.isAuthenticatedUser, admincontroller.getAllItems);
router.post("/hotelOrders", authMiddleware.isAuthenticatedUser, admincontroller.getHotelOrdersById);
router.post("/addUser", authMiddleware.isAuthenticatedUser, admincontroller.addUser);
router.post("/reviewUser", authMiddleware.isAuthenticatedUser, admincontroller.reviewUser);
router.post("/placeorderbyadmin", authMiddleware.isAuthenticatedUser, admincontroller.placeOrderByAdmin);
module.exports = router;