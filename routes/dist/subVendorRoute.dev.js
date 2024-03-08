"use strict";

var express = require("express");

var router = express.Router();

var SubVendorController = require("../controllers/SubVendorController");

var _require = require("../middleware/auth"),
    isAuthenticatedUser = _require.isAuthenticatedUser;

router.post("/add", isAuthenticatedUser, SubVendorController.addVendor);
router.post("/remove", isAuthenticatedUser, SubVendorController.removeVendor);
router.post("/additem", isAuthenticatedUser, SubVendorController.addItemToVendor);
router.post("/removeitem", isAuthenticatedUser, SubVendorController.removeItemsFromVendor);
module.exports = router;