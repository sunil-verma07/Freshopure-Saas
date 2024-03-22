const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const vendorcontroller = require("../controllers/vendorController.js");

router.post(
  "/updateItemPrice",
  authMiddleware.authMiddleware,
  vendorcontroller.setHotelItemPrice
);
router.get(
  "/orderhistory",
  authMiddleware.authMiddleware,
  vendorcontroller.orderHistoryForVendors
);
router.get(
  "/hotelsLinkedWithVendor",
  authMiddleware.authMiddleware,
  vendorcontroller.hotelsLinkedWithVendor
);
router.get(
  "/todayCompiledOrder",
  authMiddleware.authMiddleware,
  vendorcontroller.todayCompiledOrders
);
router.get(
  "/vendorItems",
  authMiddleware.authMiddleware,
  vendorcontroller.vendorItem
);
router.get(
  "/getallsubvendors",
  authMiddleware.authMiddleware,
  vendorcontroller.getAllSubVendors
);
router.post(
  "/sendcompiledorders",
  authMiddleware.authMiddleware,
  vendorcontroller.sendCompiledOrders
);
router.post(
  "/gethotelitemlist",
  authMiddleware.authMiddleware,
  vendorcontroller.getHotelItemList
);
router.post(
  "/getallordersbyhotel",
  authMiddleware.authMiddleware,
  vendorcontroller.getAllOrdersbyHotel
);

router.post(
  "/generatePdf",
  // authMiddleware.authMiddleware,
  vendorcontroller.generateInvoice
);
// // router.get("/getcartitems", authMiddleware.authMiddleware,authMiddleware.profileComplete , cartcontroller.getCartItems)
// router.post("/addnewitem", authMiddleware.authMiddleware, vendorcontroller.addNewItem)

module.exports = router;
