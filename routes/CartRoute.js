const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const cartcontroller = require('../controllers/CartController');

router.post("/additemtocart", authMiddleware.isAuthenticatedUser , cartcontroller.addItemToCart)
router.post("/removeitemfromcart", authMiddleware.isAuthenticatedUser, cartcontroller.removeItemFromCart)
router.get("/getcartitems", authMiddleware.isAuthenticatedUser, cartcontroller.getCartItems)
// router.post("/updatecartitems", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , cartcontroller.updateCartItems)


 
module.exports = router;