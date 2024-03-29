const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const ordercontroller = require("../controllers/OrderController");

router.post(
  "/placeorder",
  authMiddleware.authMiddleware,
  ordercontroller.placeOrder
);
router.get(
  "/orderhistory",
  authMiddleware.authMiddleware,
  ordercontroller.orderHistory
);
router.post(
  "/orderagain",
  authMiddleware.authMiddleware,
  authMiddleware.profileComplete,
  ordercontroller.orderAgain
);
router.post(
  "/orderanalytics",
  authMiddleware.authMiddleware,
  authMiddleware.profileComplete,
  ordercontroller.orderAnalytics
);
router.post(
  "/orderpriceanalytics",
  authMiddleware.authMiddleware,
  authMiddleware.profileComplete,
  ordercontroller.orderPriceAnalytics
);
router.post(
  "/itemanalyticsforhotel",
  authMiddleware.authMiddleware,
  authMiddleware.profileComplete,
  ordercontroller.itemAnalyticsForHotel
);
router.get(
  "/compiledorderforhotel",
  authMiddleware.authMiddleware,
  authMiddleware.profileComplete,
  ordercontroller.compiledOrderForHotel
);
router.post(
  "/orderDetails",
  authMiddleware.authMiddleware,
  ordercontroller.orderDetails
);
router.get(
  "/allHotelOrders",
  authMiddleware.authMiddleware,
  ordercontroller.allHotelOrders
);

module.exports = router;
