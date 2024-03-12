"use strict";

var express = require("express");

var router = express.Router();

var authMiddleware = require("../middleware/auth"); // const profileCompleteMiddleware = require('../middleware/auth')


var wishlistcontroller = require("../controllers/WishlistController");

router.post("/additemtowishlist", authMiddleware.authMiddleware, wishlistcontroller.addItemToWishlist);
router.post("/removeitemfromwishlist", authMiddleware.authMiddleware, wishlistcontroller.removeItemFormWishlist);
router.get("/getwishlistitems", authMiddleware.authMiddleware, wishlistcontroller.getWishlistItems);
module.exports = router;