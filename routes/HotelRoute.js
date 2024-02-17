const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const hotelcontroller = require('../controllers/HotelController.js');

router.get("/getalltemsforhotel", authMiddleware.authMiddleware , hotelcontroller.getAllItemsForHotel)
router.get("/getHotelProfile", authMiddleware.authMiddleware , hotelcontroller.myHotelProfile)
// router.post("/vendorhotellink", authMiddleware.isAuthenticatedUser, vendorcontroller.linkHoteltoVendor)
// // router.get("/getcartitems", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , cartcontroller.getCartItems)
// router.post("/addnewitem", authMiddleware.isAuthenticatedUser, vendorcontroller.addNewItem)



module.exports = router;