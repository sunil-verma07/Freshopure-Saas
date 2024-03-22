const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {distributeAmongSubvendors} = require('../utils/sendWhatsappNotification')
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const hotelcontroller = require("../controllers/HotelController.js");

router.post(
  "/getalltemsforhotel",
  authMiddleware.authMiddleware,
  hotelcontroller.getAllItemsForHotel
);
router.get(
  "/getHotelProfile",
  authMiddleware.authMiddleware,
  hotelcontroller.myHotelProfile
);

router.get(
  "/whatsapp",
  authMiddleware.authMiddleware,
  distributeAmongSubvendors
);


router.get(
  "/getAllCategories",
  authMiddleware.authMiddleware,
  hotelcontroller.getAllCategories
);
// router.post("/vendorhotellink", authMiddleware.authMiddleware, vendorcontroller.linkHoteltoVendor)
// // router.get("/getcartitems", authMiddleware.authMiddleware,authMiddleware.profileComplete , cartcontroller.getCartItems)
// router.post("/addnewitem", authMiddleware.authMiddleware, vendorcontroller.addNewItem)

module.exports = router;
