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
router.get(
  "/getAllCompiledOrders",
  authMiddleware.authMiddleware,
  ordercontroller.getAllCompiledOrders
);
router.post(
  "/orderagain",
  authMiddleware.authMiddleware,
  authMiddleware.profileComplete,
  ordercontroller.orderAgain
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
router.post(
  "/cancelOrder",
  authMiddleware.authMiddleware,
  ordercontroller.cancelOrder
);

module.exports = router;
