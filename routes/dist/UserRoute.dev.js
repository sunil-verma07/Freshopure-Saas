"use strict";

var express = require("express");

var router = express.Router();

var _require = require("../middleware/auth"),
    authMiddleware = _require.authMiddleware; // const profileCompleteMiddleware = require('../middleware/profileComplete.js')


var usercontroller = require("../controllers/UserController");

var imageService = require("../services/imageService");

var _require2 = require("../services/imageService.js"),
    upload = _require2.upload;

router.post("/login", usercontroller.login);
router.post("/resend", usercontroller.resend);
router.get("/profile", authMiddleware, usercontroller.myProfile);
router.post("/emailverification", // authMiddleware,
usercontroller.emailVerification);
router.get("/logout", authMiddleware, usercontroller.logout);
router.post("/setprofileimage", authMiddleware, upload.any(), usercontroller.setProfileImage);
router.post("/profileComplete", usercontroller.profileComplete);
router.post("/setprofile", authMiddleware, usercontroller.setProfile);
router.post("/updateUserDetails", authMiddleware, usercontroller.userDetailUpdate);
router.post("/addUserDetails", authMiddleware, upload.any(), usercontroller.addUserDetails);
router.post("/verifyToken", authMiddleware, function _callee(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          try {
            user = req.user;
            res.status(200).json({
              user: user
            });
          } catch (error) {
            res.status(500).json({
              error: "Internal server error"
            });
          }

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
});
module.exports = router;