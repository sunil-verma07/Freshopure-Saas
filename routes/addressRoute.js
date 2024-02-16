const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const addresscontroller = require('../controllers/AddressController');

router.post("/addaddress", authMiddleware.isAuthenticatedUser, addresscontroller.addAddress)
router.post("/removeaddress", authMiddleware.isAuthenticatedUser, addresscontroller.removeAddress)
router.get("/getalladdresses", authMiddleware.isAuthenticatedUser, addresscontroller.getAllAddress)
router.get("/getselectedaddress", authMiddleware.isAuthenticatedUser, addresscontroller.getSelectedAddress)
router.post("/updateselectedaddress", authMiddleware.isAuthenticatedUser, addresscontroller.updateSelectedAddress)


module.exports = router;