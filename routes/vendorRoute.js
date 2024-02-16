const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const vendorcontroller = require('../controllers/VendorController.js');

router.post("/updateItemPrice", authMiddleware.isAuthenticatedUser , vendorcontroller.setHotelItemPrice)
router.get("/orderhistory", authMiddleware.isAuthenticatedUser, vendorcontroller.orderHistoryForVendors)
router.get("/hotelsLinkedWithVendor", authMiddleware.isAuthenticatedUser, vendorcontroller.hotelsLinkedWithVendor)
router.get("/todayCompiledOrders", authMiddleware.isAuthenticatedUser, vendorcontroller.todayCompiledOrders)
// // router.get("/getcartitems", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , cartcontroller.getCartItems)
// router.post("/addnewitem", authMiddleware.isAuthenticatedUser, vendorcontroller.addNewItem)



module.exports = router;