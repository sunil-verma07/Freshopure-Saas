const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {upload} = require('../services/imageService.js');

// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const admincontroller = require('../controllers/AdminController.js');

router.post("/addnewcategory", authMiddleware.isAuthenticatedUser , admincontroller.addNewCategory)
router.post("/vendorhotellink", authMiddleware.isAuthenticatedUser, admincontroller.linkHoteltoVendor)
router.get("/orderDetailById", authMiddleware.isAuthenticatedUser, admincontroller.orderDetailById)
router.post("/addnewitem", authMiddleware.isAuthenticatedUser, upload.any(),  admincontroller.addNewItem)
router.get("/allOrders", authMiddleware.isAuthenticatedUser,  admincontroller.getAllOrders)
router.get("/allHotels", authMiddleware.isAuthenticatedUser,  admincontroller.getAllHotels)
router.get("/allVendors", authMiddleware.isAuthenticatedUser,  admincontroller.getAllVendors)
router.get("/allItems", authMiddleware.isAuthenticatedUser,  admincontroller.getAllItems)
router.get("/hotelOrders", authMiddleware.isAuthenticatedUser,  admincontroller.getHotelOrdersById)



module.exports = router;