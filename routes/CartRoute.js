const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const cartcontroller = require("../controllers/CartController");

router.post(
  "/additemtocart",
  authMiddleware.authMiddleware,
  cartcontroller.addItemToCart
);
router.post(
  "/removeitemfromcart",
  authMiddleware.authMiddleware,
  cartcontroller.removeItemFromCart
);
router.get(
  "/getcartitems",
  authMiddleware.authMiddleware,
  cartcontroller.getCartItems
);
// router.post("/updatecartitems", authMiddleware.authMiddleware,authMiddleware.profileComplete , cartcontroller.updateCartItems)

module.exports = router;
