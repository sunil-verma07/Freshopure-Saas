const express = require('express');
const router = express.Router();
const {isAuthenticatedUser} = require('../middleware/auth');
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const usercontroller = require('../controllers/UserController');
const imageService = require('../services/imageService')

router.post("/login", usercontroller.login)
router.post("/register", usercontroller.register)
router.get("/profile", usercontroller.myProfile)
router.get("/logout", isAuthenticatedUser, usercontroller.logout)
router.post("/setprofileimage", isAuthenticatedUser,imageService.upload.any(), usercontroller.setProfileImage)
router.post('/setprofile', isAuthenticatedUser, usercontroller.setProfile);


module.exports = router;