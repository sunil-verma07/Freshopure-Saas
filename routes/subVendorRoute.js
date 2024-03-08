const express = require("express");
const router = express.Router();
const SubVendorController = require("../controllers/SubVendorController");
const { isAuthenticatedUser } = require("../middleware/auth");

router.post("/add", isAuthenticatedUser, SubVendorController.addVendor);
router.post("/remove", isAuthenticatedUser, SubVendorController.removeVendor);
router.post(
  "/additem",
  isAuthenticatedUser,
  SubVendorController.addItemToVendor
);
router.post(
  "/removeitem",
  isAuthenticatedUser,
  SubVendorController.removeItemsFromVendor
);

module.exports = router;
