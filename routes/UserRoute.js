const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const usercontroller = require("../controllers/UserController");
const imageService = require("../services/imageService");

router.post("/login", usercontroller.login);
router.post("/register", usercontroller.register);
router.get("/profile", authMiddleware, usercontroller.myProfile);
router.post(
  "/emailverification",
  authMiddleware,
  usercontroller.emailVerification
);
router.get("/logout", authMiddleware, usercontroller.logout);
router.post(
  "/setprofileimage",
  authMiddleware,
  imageService.upload.any(),
  usercontroller.setProfileImage
);
router.post("/setprofile", authMiddleware, usercontroller.setProfile);
router.post(
  "/updateUserDetails",
  authMiddleware,
  usercontroller.userDetailUpdate
);

router.get('/test',usercontroller.testApi)

module.exports = router;
