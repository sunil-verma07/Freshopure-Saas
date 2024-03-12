"use strict";

var express = require("express");

var router = express.Router();

var _require = require("../middleware/auth"),
    authMiddleware = _require.authMiddleware; // const profileCompleteMiddleware = require('../middleware/profileComplete.js')


var usercontroller = require("../controllers/UserController");

var imageService = require("../services/imageService");

router.post("/login", usercontroller.login);
router.post("/register", usercontroller.register);
router.get("/profile", authMiddleware, usercontroller.myProfile);
router.get("/logout", authMiddleware, usercontroller.logout);
router.post("/setprofileimage", authMiddleware, imageService.upload.any(), usercontroller.setProfileImage);
router.post("/setprofile", authMiddleware, usercontroller.setProfile);
module.exports = router;