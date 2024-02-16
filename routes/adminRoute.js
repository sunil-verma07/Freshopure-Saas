const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {upload} = require('../services/imageService.js');

// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const admincontroller = require('../controllers/AdminController.js');

router.post("/addnewcategory", authMiddleware.isAuthenticatedUser , admincontroller.addNewCategory)
router.post("/vendorhotellink", authMiddleware.isAuthenticatedUser, admincontroller.linkHoteltoVendor)
// router.get("/getcartitems", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , cartcontroller.getCartItems)
router.post("/addnewitem", authMiddleware.isAuthenticatedUser, upload.any(),  admincontroller.addNewItem)



module.exports = router;