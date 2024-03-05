"use strict";

var express = require("express");

var router = express.Router();

var authMiddleware = require("../middleware/auth"); // const profileCompleteMiddleware = require('../middleware/profileComplete.js')


var cartcontroller = require("../controllers/CartController");

router.post("/additemtocart", authMiddleware.isAuthenticatedUser, cartcontroller.addItemToCart);
router.post("/removeitemfromcart", authMiddleware.authMiddleware, cartcontroller.removeItemFromCart);
router.get("/getcartitems", authMiddleware.authMiddleware, cartcontroller.getCartItems); // router.post("/updatecartitems", authMiddleware.isAuthenticatedUser,authMiddleware.profileComplete , cartcontroller.updateCartItems)

module.exports = router;