const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { upload } = require("../services/imageService.js");

// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const admincontroller = require("../controllers/AdminController.js");

router.post(
  "/addnewcategory",
  authMiddleware.authMiddleware,
  upload.any(),
  admincontroller.addNewCategory
);

router.post(
  "/addnewplan",
  // authMiddleware.authMiddleware,
  admincontroller.addNewPaymentPlan
);

router.post(
  "/vendorhotellink",
  // authMiddleware.authMiddleware,
  admincontroller.linkHoteltoVendor
);
router.post(
  "/orderDetailById",
  authMiddleware.authMiddleware,
  admincontroller.orderDetailById
);
router.post(
  "/addnewitem",
  // authMiddleware.authMiddleware,
  upload.any(),
  admincontroller.addNewItem
);
router.get(
  "/allOrders",
  authMiddleware.authMiddleware,
  admincontroller.getAllOrders
);
router.get(
  "/allHotels",
  authMiddleware.authMiddleware,
  admincontroller.getAllHotels
);
router.get(
  "/allVendors",
  authMiddleware.authMiddleware,
  admincontroller.getAllVendors
);
router.get(
  "/allItems",
  authMiddleware.authMiddleware,
  admincontroller.getAllItems
);
router.post(
  "/hotelOrders",
  authMiddleware.authMiddleware,
  admincontroller.getHotelOrdersById
);
router.post(
  "/addHotel",
  authMiddleware.authMiddleware,
  admincontroller.addHotel
);
router.post(
  "/removeHotel",
  authMiddleware.authMiddleware,
  admincontroller.removeHotel
);

router.post(
  "/addVendor",
  authMiddleware.authMiddleware,
  admincontroller.addVendor
);

router.post(
  "/removeVendor",
  authMiddleware.authMiddleware,
  admincontroller.removeVendor
);

router.post(
  "/removeItem",
  authMiddleware.authMiddleware,
  admincontroller.removeItem
);

router.post(
  "/reviewUser",
  authMiddleware.authMiddleware,
  admincontroller.reviewUser
);
router.post(
  "/placeorderbyadmin",
  authMiddleware.authMiddleware,
  admincontroller.placeOrderByAdmin
);
router.get(
  "/getAllCategories",
  authMiddleware.authMiddleware,
  admincontroller.getAllCategories
);
router.get(
  "/getVendors/:hotelId",
  authMiddleware.authMiddleware,
  admincontroller.getHotelVendors
);
router.get(
  "/getOrders/:hotelId",
  authMiddleware.authMiddleware,
  admincontroller.getHotelOrders
);
router.get(
  "/getItems/:hotelId",
  authMiddleware.authMiddleware,
  admincontroller.getHotelItems
);
router.get(
  "/getHotels/:vendorId",
  authMiddleware.authMiddleware,
  admincontroller.getVendorHotels
);
router.get(
  "/getVendorOrders/:vendorId",
  authMiddleware.authMiddleware,
  admincontroller.getVendorOrders
);
router.get(
  "/getVendorItems/:vendorId",
  authMiddleware.authMiddleware,
  admincontroller.getVendorItems
);
router.get(
  "/getAssignableHotels/:vendorId",
  authMiddleware.authMiddleware,
  admincontroller.getAssignableHotels
);
module.exports = router;
