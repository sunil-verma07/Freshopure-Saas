"use strict";

var express = require("express");

var router = express.Router();

var authMiddleware = require("../middleware/auth"); // const profileCompleteMiddleware = require('../middleware/profileComplete.js')


var ordercontroller = require("../controllers/OrderController");

router.post("/placeorder", authMiddleware.authMiddleware, ordercontroller.placeOrder);
router.get("/orderhistory", authMiddleware.authMiddleware, ordercontroller.orderHistory);
router.post("/orderagain", authMiddleware.authMiddleware, authMiddleware.profileComplete, ordercontroller.orderAgain);
router.post("/orderanalytics", authMiddleware.authMiddleware, authMiddleware.profileComplete, ordercontroller.orderAnalytics);
router.post("/orderpriceanalytics", authMiddleware.authMiddleware, authMiddleware.profileComplete, ordercontroller.orderPriceAnalytics);
router.post("/itemanalyticsforhotel", authMiddleware.authMiddleware, authMiddleware.profileComplete, ordercontroller.itemAnalyticsForHotel);
router.get("/compiledorderforhotel", authMiddleware.authMiddleware, authMiddleware.profileComplete, ordercontroller.compiledOrderForHotel);
module.exports = router;