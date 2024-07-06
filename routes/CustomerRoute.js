const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const CustomerController = require("../controllers/CustomerController");

router.post(
  "/getallItemsforCustomer",
  authMiddleware.authMiddleware,
  CustomerController.getAllItemsForHotel
);

router.get(
  "/getAllCategories",
  authMiddleware.authMiddleware,
  CustomerController.getAllCategories
);

module.exports = router;
