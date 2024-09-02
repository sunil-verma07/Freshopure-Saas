"use strict";

var express = require("express");

var router = express.Router();

var authMiddleware = require("../middleware/auth");

var addresscontroller = require("../controllers/AddressController");

router.post("/addaddress", authMiddleware.authMiddleware, addresscontroller.addAddress);
router.post("/removeaddress", authMiddleware.authMiddleware, addresscontroller.removeAddress);
router.get("/getalladdresses", authMiddleware.authMiddleware, addresscontroller.getAllAddress);
router.get("/getselectedaddress", authMiddleware.authMiddleware, addresscontroller.getSelectedAddress);
router.post("/updateselectedaddress", authMiddleware.authMiddleware, addresscontroller.updateSelectedAddress);
module.exports = router;