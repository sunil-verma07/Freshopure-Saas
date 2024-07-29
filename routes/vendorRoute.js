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

router.post(
  "/itemAnalytics",
  authMiddleware.authMiddleware,
  vendorcontroller.getItemAnalytics
);

router.post(
  "/freshoCalculator",
  authMiddleware.authMiddleware,
  vendorcontroller.freshoCalculator
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
router.get(
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
  "/updateVendorItemStock",
  authMiddleware.authMiddleware,
  vendorcontroller.updateVendorItemStock
);

router.post(
  "/updateCompiledItemQuantity",
  authMiddleware.authMiddleware,
  vendorcontroller.updateCompiledItemQuantity
);


router.post(
  "/updateVendorItemWaste",
  authMiddleware.authMiddleware,
  vendorcontroller.updateVendorItemWaste
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
  "/getAllPaymentPlans",
  // authMiddleware.authMiddleware,
  vendorcontroller.getAllPaymentPlans
);

router.post(
  "/orderAnalytics",
  authMiddleware.authMiddleware,
  vendorcontroller.getVendorOrderAnalytics
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

router.post(
  "/removeVendorItem",
  authMiddleware.authMiddleware,
  vendorcontroller.removeVendorItem
);

router.post(
  "/updateItemProfit",
  authMiddleware.authMiddleware,
  vendorcontroller.updateHotelItemProfit
);

router.post("/updateOrderStatus", vendorcontroller.orderStatusUpdate);

router.post("/msgToSubvendor", vendorcontroller.msgToSubVendor);

router.get(
  "/getAllPlans",
  authMiddleware.authMiddleware,
  vendorcontroller.getAllPaymentPlans
);
router.post(
  "/planSubscribed",
  authMiddleware.authMiddleware,
  vendorcontroller.generatePlanToken
);

router.post(
  "/changeOrderQuantity",
  authMiddleware.authMiddleware,
  vendorcontroller.changeOrderQuantity
);

router.post(
  "/totalSales",
  authMiddleware.authMiddleware,
  vendorcontroller.totalSales
);
router.post(
  "/StatusToDelivered",
  authMiddleware.authMiddleware,
  vendorcontroller.statusUpdateToDelivered
);
router.post(
  "/importAssignedItems",
  authMiddleware.authMiddleware,
  vendorcontroller.importAssignedItems
);

router.post(
  "/updatePrice",
  authMiddleware.authMiddleware,
  vendorcontroller.updatePrice
);
router.post(
  "/changeHotelType",
  authMiddleware.authMiddleware,
  vendorcontroller.changeHotelType
);
router.get(
  "/searchQueryForVendoritems",
  authMiddleware.authMiddleware,
  vendorcontroller.searchQueryForVendorItems
);

// // router.get("/getcartitems", authMiddleware.authMiddleware,authMiddleware.profileComplete , cartcontroller.getCartItems)
// router.post("/addnewitem", authMiddleware.authMiddleware, vendorcontroller.addNewItem)

module.exports = router;
