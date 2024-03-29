"use strict";

var express = require("express");

var router = express.Router();

var authMiddleware = require("../middleware/auth");

var _require = require("../services/imageService.js"),
    upload = _require.upload; // const profileCompleteMiddleware = require('../middleware/profileComplete.js')


var admincontroller = require("../controllers/AdminController.js");

router.post("/addnewcategory", authMiddleware.authMiddleware, admincontroller.addNewCategory);
router.post("/vendorhotellink", authMiddleware.authMiddleware, admincontroller.linkHoteltoVendor);
router.post("/orderDetailById", authMiddleware.authMiddleware, admincontroller.orderDetailById);
router.post("/addnewitem", authMiddleware.authMiddleware, upload.any(), admincontroller.addNewItem);
router.get("/allOrders", authMiddleware.authMiddleware, admincontroller.getAllOrders);
router.get("/allHotels", authMiddleware.authMiddleware, admincontroller.getAllHotels);
router.get("/allVendors", authMiddleware.authMiddleware, admincontroller.getAllVendors);
router.get("/allItems", authMiddleware.authMiddleware, admincontroller.getAllItems);
router.post("/hotelOrders", authMiddleware.authMiddleware, admincontroller.getHotelOrdersById);
router.post("/addUser", authMiddleware.authMiddleware, admincontroller.addUser);
router.post("/reviewUser", authMiddleware.authMiddleware, admincontroller.reviewUser);
router.post("/placeorderbyadmin", authMiddleware.authMiddleware, admincontroller.placeOrderByAdmin);
router.get("/getAllCategories", authMiddleware.authMiddleware, admincontroller.getAllCategories);
router.get("/getVendors/:hotelId", authMiddleware.authMiddleware, admincontroller.getHotelVendors);
router.get("/getOrders/:hotelId", authMiddleware.authMiddleware, admincontroller.getHotelOrders);
router.get("/getItems/:hotelId", authMiddleware.authMiddleware, admincontroller.getHotelItems);
router.get("/getHotels/:vendorId", authMiddleware.authMiddleware, admincontroller.getVendorHotels);
router.get("/getVendorOrders/:vendorId", authMiddleware.authMiddleware, admincontroller.getVendorOrders);
router.get("/getVendorItems/:vendorId", authMiddleware.authMiddleware, admincontroller.getVendorItems);
module.exports = router;