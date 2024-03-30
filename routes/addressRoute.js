const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const addresscontroller = require("../controllers/AddressController");

router.post(
  "/addaddress",
  authMiddleware.authMiddleware,
  addresscontroller.addAddress
);
router.post(
  "/removeaddress",
  authMiddleware.authMiddleware,
  addresscontroller.removeAddress
);
router.get(
  "/getalladdresses",
  authMiddleware.authMiddleware,
  addresscontroller.getAllAddress
);

router.post(
  "/updateselectedaddress",
  authMiddleware.authMiddleware,
  addresscontroller.updateSelectedAddress
);

module.exports = router;
