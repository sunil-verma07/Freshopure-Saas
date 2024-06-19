const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
// const profileCompleteMiddleware = require('../middleware/profileComplete.js')
const usercontroller = require("../controllers/UserController");
const imageService = require("../services/imageService");
const { upload } = require("../services/imageService.js");

router.post("/login", usercontroller.login);
router.post("/resend", usercontroller.resend);
router.get("/profile", authMiddleware, usercontroller.myProfile);
router.post(
  "/emailverification",
  // authMiddleware,
  usercontroller.emailVerification
);
router.get("/logout", authMiddleware, usercontroller.logout);
router.post(
  "/setprofileimage",
  authMiddleware,
  upload.any(),
  usercontroller.setProfileImage
);
router.post("/profileComplete", usercontroller.profileComplete);
router.post(
  "/updateUserDetails",
  authMiddleware,
  usercontroller.userDetailUpdate
);

router.post(
  "/addUserDetails",
  authMiddleware,
  upload.any(),
  usercontroller.addUserDetails
);
router.post("/verifyToken", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
     console.log(user,'setuser')
    res.status(200).json({ user:user[0] });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
