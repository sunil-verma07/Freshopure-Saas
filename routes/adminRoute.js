const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { upload } = require("../services/imageService.js");

// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const admincontroller = require("../controllers/AdminController.js");

router.post(
  "/addnewcategory",
  authMiddleware.isAuthenticatedUser,
  admincontroller.addNewCategory
);
router.post(
  "/vendorhotellink",
  authMiddleware.isAuthenticatedUser,
  admincontroller.linkHoteltoVendor
);
router.post(
  "/orderDetailById",
  authMiddleware.isAuthenticatedUser,
  admincontroller.orderDetailById
);
router.post(
  "/addnewitem",

  upload.any(),
  admincontroller.addNewItem
);
router.get("/allOrders", admincontroller.getAllOrders);
router.get("/allHotels", admincontroller.getAllHotels);
router.get("/allVendors", admincontroller.getAllVendors);
router.get(
  "/allItems",

  admincontroller.getAllItems
);
router.post(
  "/hotelOrders",
  authMiddleware.isAuthenticatedUser,
  admincontroller.getHotelOrdersById
);
router.post(
  "/addUser",
  authMiddleware.isAuthenticatedUser,
  admincontroller.addUser
);
router.post(
  "/reviewUser",
  authMiddleware.isAuthenticatedUser,
  admincontroller.reviewUser
);
router.post(
  "/placeorderbyadmin",
  authMiddleware.isAuthenticatedUser,
  admincontroller.placeOrderByAdmin
);
router.get("/getAllCategories", admincontroller.getAllCategories);
router.get("/getVendors/:hotelId", admincontroller.getHotelVendors);
router.get("/getOrders/:hotelId", admincontroller.getHotelOrders);
router.get("/getItems/:hotelId", admincontroller.getHotelItems);
router.get("/getHotels/:vendorId", admincontroller.getVendorHotels);
router.get("/getVendorOrders/:vendorId", admincontroller.getVendorOrders);
router.get("/getVendorItems/:vendorId", admincontroller.getVendorItems);

module.exports = router;
