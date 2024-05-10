const express = require("express");
require("dotenv").config();

const itemImageS3 = require("../services/itemImageS3.js");
const AWS = require("aws-sdk");
const fs = require("fs");
const { ObjectId } = require("mongodb");
const ErrorHandler = require("../utils/errorhander.js");
const router = express.Router();
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const User = require("../models/user.js");
const Role = require("../models/role.js");

const Address = require("../models/address.js");
const { encrypt, decrypt } = require("../services/encryptionServices");

const {
  sendEmailVerification,
  checkVerification,
  sendMail,
  resendOtp,
} = require("../utils/sendEmailVerification.js");
const { sendToken } = require("../utils/jwtToken.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.js");
const { isAuthenticatedUser } = require("../middleware/auth.js");
const userDetails = require("../models/userDetails.js");
const { sendOtp, verifyOtp } = require("../utils/sendEmailVerification.js");

const myProfile = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.aggregate([
    { $match: { _id: userId } },
    {
      $lookup: {
        from: "UserDetails",
        localField: "_id",
        foreignField: "userId",
        as: "imageDetails",
      },
    },
    {
      $unwind: "$imageDetails",
    },
  ]);

  if (!user) {
    return res
      .status(401)
      .json({ success: false, error: "Unauthenticated User" });
  } else {
    return res.status(200).json({ user: user[0] });
  }
});

const logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

const emailVerification = catchAsyncErrors(async (req, res) => {
  try {
    const { phone, code } = req.body;
    console.log(phone, code);

    const { message } = await verifyOtp(phone, code);
    console.log(message, "resp");
    if (message !== "OTP verified success") {
      return res.json({ success: false, message: message });
    } else {
      const user = await User.findOne({ phone: phone });
      if (user) {
        if (user.isProfileComplete === true && user.isApproved === true) {
          const roleId = await Role.findOne({ _id: user.roleId });
          return sendToken(user, 200, res, roleId.name);
        }
      } else {
        const newUser = await User.create({
          phone: phone,
        });
        res.status(200).json({ success: true, user });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, error: error });
  }
});

const login = catchAsyncErrors(async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter your phone number!" });
    } else {
      await sendOtp(phone);
      // console.log(res, "res");
    }

    return res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    console.log(error, "err");
    return res.status(401).json({ message: "Failed to send OTP" });
  }
});

const resend = catchAsyncErrors(async (req, res, next) => {
  try {
    const { phone } = req.body;
    console.log(phone);

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter your phone number!" });
    } else {
      await resendOtp(phone);
    }

    return res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    console.log(error, "err");
    return res.status(401).json({ message: "Failed to send OTP" });
  }
});

const setProfile = catchAsyncErrors(async (req, res, next) => {
  try {
    const UserId = req.user._id;
    const {
      hotelName,
      addressLine1,
      addressLine2,
      state,
      city,
      pinCode,
      update,
    } = req.body;
    if (update) {
      await User.updateOne(
        { UserId: new ObjectId(UserId) },
        { $set: { fullName: fullName, hotelName: hotelName } }
      );
      res.status(200).json({ message: "User Profile Updated" });
    } else {
      const profile = new User({
        UserId,
        hotelName,
      });
      await profile.save();

      await Address.updateMany(
        { UserId: new ObjectId(UserId), selected: true },
        { $set: { selected: false } }
      );

      const address = new Address({
        UserId,
        hotelName,
        addressLine1,
        addressLine2,
        state,
        city,
        pinCode,
      });
      await address.save();

      await User.updateOne(
        { _id: new ObjectId(UserId) },
        { $set: { isProfieComplete: true } }
      );
      res.status(200).json({ message: "User Profile Updated" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const profileComplete = catchAsyncErrors(async (req, res, next) => {
  try {
    const { fullName, organization, role, email, phone } = req.body;
    console.log(fullName, organization, role, email, phone);

    if (!fullName || !organization || !role || !email || !phone) {
      console.log("problem");
      return res
        .status(400)
        .json({ success: false, error: "Please enter all fields properly!" });
    } else {
      console.log(phone, "phone0");
      const roleId = await Role.findOne({ name: role });
      console.log(phone, "phone");
      const user = await User.findOne({ phone: phone });
      console.log(phone, "phone2");
      console.log(roleId, "ri");
      if (user) {
        user.fullName = fullName;
        user.organization = organization;
        user.roleId = roleId._id;
        user.email = email;
        user.isProfileComplete = true;
        await user.save();

        return res
          .status(200)
          .json({ success: true, message: "Profile Completed!", user: user });
      } else {
        console.log("errr");
        return res
          .status(400)
          .json({ success: false, error: "Can't Update User Details!" });
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Internal Server Error" });
  }
});

const setProfileImage = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log(req, "req");
    const userId = req.user._id;
    const images = req.files;

    console.log(images, "img");

    if (!images) {
      return res.json({ message: "Please Select an Image" });
    }

    let imagesReqBody = [];
    for (let i = 0; i < images.length; ++i) {
      const image = images[i];
      const result = await itemImageS3.uploadFile(image);
      // console.log(result)
      await unlinkFile(image.path);
      if (image.fieldname == "image") isDisplayImage = true;
      const imageReqBody = {
        imageLink: `/items/image/${result.Key}`,
      };
      // console.log(imageReqBody,result);
      imagesReqBody.push(imageReqBody);
    }

    let user = await userDetails.findOne({ userId: userId });
    if (user) {
      user.img = imagesReqBody[0].imageLink;
    } else {
      user = userDetails.create({
        userId: userId,
        img: imagesReqBody[0].imageLink,
      });
    }

    await user.save();

    // Respond to the client
    res
      .status(201)
      .json({ message: "File uploaded and saved successfully", user: user });
  } catch (error) {
    console.log(error, "err");
    res.status(200).json({ error: "Internal server error" });
  }
});

const userDetailUpdate = catchAsyncErrors(async (req, res, next) => {
  try {
    const { fullName, organization, phone, email } = req.body;
    const userId = req.user._id;

    if (!fullName || !organization || !phone || !email) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter all fields properly!" });
    } else {
      const user = await User.findOne({ _id: userId });

      if (user) {
        user.fullName = fullName;
        user.organization = organization;
        user.phone = phone;
        user.email = email;

        await user.save();

        return res.json({ message: "User Details Updated", user: user });
      } else {
        return res
          .status(400)
          .json({ success: false, error: "Can't Update User Details!" });
      }
    }
  } catch (err) {
    return res.status(400).json({ message: "Internal Server Error" });
  }
});

// const addUserDetails = catchAsyncErrors(async function (req, res, next) {
//   const userId = req.user._id;
//   const images = req.files;

//   console.log(images, "img");
//   try {
//     if (!images) {
//       return res.json({ message: "Please Select an Image" });
//     }

//     let imagesReqBody = [];
//     for (let i = 0; i < images.length; ++i) {
//       const image = images[i];
//       const result = await itemImageS3.uploadFile(image);
//       // console.log(result)
//       await unlinkFile(image.path);
//       if (image.fieldname == "image") isDisplayImage = true;
//       const imageReqBody = {
//         imageLink: `/items/image/${result.Key}`,
//       };
//       // console.log(imageReqBody,result);
//       imagesReqBody.push(imageReqBody);
//     }

//     let user = await userDetails.findOne({ userId: userId });
//     if (user) {
//       user.img = imagesReqBody[0].imageLink;
//     } else {
//       user = userDetails.create({
//         userId: userId,
//         img: imagesReqBody[0].imageLink,
//       });
//     }

//     await user.save();

//     res
//       .status(201)
//       .json({ message: "User Details Updated successfully", user: user });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

const addUserDetails = catchAsyncErrors(async function (req, res, next) {
  const userId = req.user._id;
  const image = req.file; // Changed to req.file to handle only one image

  console.log(image, "img");
  try {
    if (!image) {
      return res.json({ message: "Please Select an Image" });
    }

    const result = await itemImageS3.uploadFile(image);
    await unlinkFile(image.path);

    let user = await userDetails.findOne({ userId: userId });
    if (user) {
      user.img = `/items/image/${result.Key}`;
    } else {
      user = userDetails.create({
        userId: userId,
        img: `/items/image/${result.Key}`,
      });
    }

    await user.save();

    res
      .status(201)
      .json({ message: "User Details Updated successfully", user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = {
  login,
  emailVerification,
  myProfile,
  logout,
  resend,
  setProfile,
  setProfileImage,
  userDetailUpdate,
  addUserDetails,
  profileComplete,
};
