const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const ordercontroller = require('../controllers/OrderController');

router.post("/placeorder", authMiddleware.isAuthenticatedUser, ordercontroller.placeOrder);
router.get("/orderhistory", authMiddleware.isAuthenticatedUser, ordercontroller.orderHistory);
router.post("/orderagain", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , ordercontroller.orderAgain);
router.post("/orderanalytics", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , ordercontroller.orderAnalytics);
router.post("/orderpriceanalytics", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , ordercontroller.orderPriceAnalytics);
router.post("/itemanalyticsforhotel", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , ordercontroller.itemAnalyticsForHotel);
router.get("/compiledorderforhotel", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , ordercontroller.compiledOrderForHotel);
module.exports = router; 