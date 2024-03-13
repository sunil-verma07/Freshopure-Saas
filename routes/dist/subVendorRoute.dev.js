"use strict";

var express = require("express");

var router = express.Router();

var SubVendorController = require("../controllers/SubVendorController");

var _require = require("../middleware/auth"),
    authMiddleware = _require.authMiddleware;

router.post("/add", authMiddleware, SubVendorController.addVendor);
router.post("/remove", authMiddleware, SubVendorController.removeVendor);
router.post("/additem", authMiddleware, SubVendorController.addItemToVendor);
router.post("/removeitem", authMiddleware, SubVendorController.removeItemsFromVendor);
router.get("/subVendorItem", authMiddleware, SubVendorController.getSubVendorItems);
module.exports = router;