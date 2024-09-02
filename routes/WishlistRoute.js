const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
// const profileCompleteMiddleware = require('../middleware/auth')
const wishlistcontroller = require("../controllers/WishlistController");

router.post(
  "/additemtowishlist",
  authMiddleware.authMiddleware,
  wishlistcontroller.addItemToWishlist
);
router.post(
  "/removeitemfromwishlist",
  authMiddleware.authMiddleware,
  wishlistcontroller.removeItemFormWishlist
);
router.get(
  "/getwishlistitems",
  authMiddleware.authMiddleware,
  wishlistcontroller.getWishlistItems
);

module.exports = router;
