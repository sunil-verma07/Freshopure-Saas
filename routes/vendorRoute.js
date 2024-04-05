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
router.post(
  "/orderAnalytics",
  authMiddleware.authMiddleware,
  vendorcontroller.getVendorOrderAnalytics
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
router.post(
  "/updateStock",
  authMiddleware.authMiddleware,
  vendorcontroller.updateStock
);

router.post(
  "/addStock",
  authMiddleware.authMiddleware,
  vendorcontroller.addItemToStock
);
router.get(
  "/getVendorStocks",
  authMiddleware.authMiddleware,
  vendorcontroller.getVendorStocks
);

router.post(
  "/deleteItemStock",
  authMiddleware.authMiddleware,
  vendorcontroller.deleteItemFromStock
);

router.post(
  "/deleteHotelItem",
  authMiddleware.authMiddleware,
  vendorcontroller.deleteHotelItem
);

router.post(
  "/addHotelItem",
  authMiddleware.authMiddleware,
  vendorcontroller.addHotelItem
);

router.post(
  "/gethotelAssignableItems",
  authMiddleware.authMiddleware,
  vendorcontroller.getHotelAssignableItems
);

router.get(
  "/getVendorCategories",
  authMiddleware.authMiddleware,
  vendorcontroller.getVendorCategories
);

router.get(
  "/addStockOptions",
  authMiddleware.authMiddleware,
  vendorcontroller.addStockItemOptions
);

router.post(
  "/addVendorItem",
  authMiddleware.authMiddleware,
  vendorcontroller.addVendorItem
);

router.get(
  "/getVendorItem",
  authMiddleware.authMiddleware,
  vendorcontroller.getAllVendorItems
);

router.get(
  "/itemsForVendor",
  authMiddleware.authMiddleware,
  vendorcontroller.itemsForVendor
);

router.post(
  "/setVendorItemPrice",
  authMiddleware.authMiddleware,
  vendorcontroller.setVendorItemPrice
);
// // router.get("/getcartitems", authMiddleware.authMiddleware,authMiddleware.profileComplete , cartcontroller.getCartItems)
// router.post("/addnewitem", authMiddleware.authMiddleware, vendorcontroller.addNewItem)

module.exports = router;
