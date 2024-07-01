const catchAsyncErrors = require("./catchAsyncErrors.js");
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const Role = require("../models/role.js");
const { ObjectId } = require("mongodb");

require("dotenv").config();
const cookieParser = require("cookie-parser");

exports.authMiddleware = async (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    console.log(token, "token");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(decoded, "decoded");
    let data = await User.aggregate([
      { $match: { _id: new ObjectId(decoded.id) } },
      {
        $lookup: {
          from: "UserDetails", // Name of the UserDetails collection
          localField: "_id",
          foreignField: "userId",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } }, // Unwind the userDetails array
      {
        $addFields: {
          fullName: "$userDetails.fullName",
          email: "$userDetails.email",
          roleId: "$userDetails.roleId",
          organization: "$userDetails.organization",
        },
      },
      { $project: { userDetails: 0 } },
    ]).exec();

    console.log(data[0], "data user");
    req.user = data[0];

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Invalid token" });
  }
};

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  console.log(token);
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Unauthenticated User" });
  } else {
    try {
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decodedData.id);
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    next();
  }
});

exports.authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    const userRole = await Role.findOne({ _id: req.user.roleId });
    if (!roles.includes(userRole.name.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: `${userRole.name} is not allowed to access this resouce`,
      });
    } else {
      next();
    }
  };
};

exports.profileComplete = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = req.user;
    if (user.isProfieComplete == true) {
      if (user.isProfileReviewed == true && user.reviewStatus == "Approved") {
        next();
      } else {
        res.status(406).json({
          profileComplete: false,
          isProfileReviewed: user.isProfileReviewed,
          reviewStatus: user.reviewStatus,
          error: "Profile Not Reviewed",
        });
      }
    } else {
      res
        .status(406)
        .json({ profileComplete: false, error: "Profile Not Completed" });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});
