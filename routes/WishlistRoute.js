const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
// const profileCompleteMiddleware = require('../middleware/auth')
const wishlistcontroller = require('../controllers/WishlistController');

router.post("/additemtowishlist", authMiddleware.isAuthenticatedUser , wishlistcontroller.addItemToWishlist)
router.post("/removeitemfromwishlist", authMiddleware.isAuthenticatedUser, wishlistcontroller.removeItemFormWishlist)
router.get("/getwishlistitems", authMiddleware.isAuthenticatedUser, wishlistcontroller.getWishlistItems)


module.exports = router; 