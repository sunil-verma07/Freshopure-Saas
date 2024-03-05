const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const vendorcontroller = require("../controllers/VendorController.js");

router.post(
  "/updateItemPrice",
  authMiddleware.isAuthenticatedUser,
  vendorcontroller.setHotelItemPrice
);
router.get(
  "/orderhistory",
  authMiddleware.isAuthenticatedUser,
  vendorcontroller.orderHistoryForVendors
);
router.get(
  "/hotelsLinkedWithVendor",
  authMiddleware.isAuthenticatedUser,
  vendorcontroller.hotelsLinkedWithVendor
);
router.get(
  "/todayCompiledOrder",
  authMiddleware.isAuthenticatedUser,
  vendorcontroller.todayCompiledOrders
);
router.get(
  "/vendorItems",
  authMiddleware.isAuthenticatedUser,
  vendorcontroller.vendorItem
);
router.get(
  "/getallsubvendors",
  authMiddleware.isAuthenticatedUser,
  vendorcontroller.getAllSubVendors
);
router.post(
  "/sendcompiledorders",
  authMiddleware.isAuthenticatedUser,
  vendorcontroller.sendCompiledOrders
);
router.get(
  "/gethotelitemlist",
  authMiddleware.isAuthenticatedUser,
  vendorcontroller.getHotelItemList
);
router.get(
  "/getallordersbyhotel",
  authMiddleware.isAuthenticatedUser,
  vendorcontroller.getAllOrdersbyHotel
);
// // router.get("/getcartitems", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , cartcontroller.getCartItems)
// router.post("/addnewitem", authMiddleware.isAuthenticatedUser, vendorcontroller.addNewItem)

module.exports = router;
