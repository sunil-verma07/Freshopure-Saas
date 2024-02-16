const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const itemcontroller = require('../controllers/ItemController');

router.get("/getalltemsforhotel",authMiddleware.isAuthenticatedUser, itemcontroller.getAllItemsForHotel)



module.exports = router;