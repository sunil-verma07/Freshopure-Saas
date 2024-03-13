const express = require("express");
const router = express.Router();
const SubVendorController = require("../controllers/SubVendorController");
const { authMiddleware } = require("../middleware/auth");

router.post("/add", authMiddleware, SubVendorController.addVendor);
router.post("/remove", authMiddleware, SubVendorController.removeVendor);
router.post("/additem", authMiddleware, SubVendorController.addItemToVendor);
router.post(
  "/removeitem",
  authMiddleware,
  SubVendorController.removeItemsFromVendor
);
router.get(
  "/subVendorItem",
  authMiddleware,
  SubVendorController.getSubVendorItems
);

module.exports = router;
