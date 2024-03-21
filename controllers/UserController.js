const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const msg91 = require("msg91").default;
const AWS = require("aws-sdk");
const fs = require("fs");
const ErrorHandler = require("../utils/errorhander.js");
const router = express.Router();
const User = require("../models/user.js");
const Role = require("../models/role.js");
const Address = require("../models/address.js");
const bcrypt = require("bcrypt");
const { encrypt, decrypt } = require("../services/encryptionServices");
const {
  sendEmailVerification,
  checkVerification,
} = require("../utils/sendEmailVerification.js");
const sendToken = require("../utils/jwtToken.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.js");
const { isAuthenticatedUser } = require("../middleware/auth.js");

const register = catchAsyncErrors(async (req, res, next) => {
  try {
    const { organization, fullName, email, phone, password, role } = req.body;
    if (!organization || !fullName || !email || !password || !phone || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all feilds properly!" });
    } else {
      const user = await User.findOne({ email: email }).select("+password");
      console.log(user);
      if (user) {
        return res
          .status(400)
          .json({ success: false, error: "User already exists!" });
      } else {
        const hashedPassword = encrypt(password);

        const userRole = await Role.findOne({ name: role });

        const newUser = await User.create({
          organization: organization,
          email: email,
          phone: phone,
          password: hashedPassword,
          fullName: fullName,
          roleId: userRole._id,
        });

        sendEmailVerification(email, function (error) {
          if (error) {
            return res.status(500).json({ success: false, error: error });
          } else {
            res.status(200).json({ user: newUser });
          }
        });
      }
    }
  } catch (error) {
    res.send(error);
  }
});

const myProfile = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findOne({ _id: userId }).populate("roleId");
  if (!user) {
    return res
      .status(401)
      .json({ success: false, error: "Unauthenticated User" });
  } else {
    return res.status(200).json({ success: true, user: user });
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
    const { email, code } = req.body;
    await checkVerification(email, code, function (error, status) {
      if (error) {
        sendEmailVerification(email, function (error2) {
          if (error2) {
            res.status(400).json({ success: false, error: error2 });
          } else {
            res.status(500).json({
              success: false,
              error: error + ". Please enter the new code sent to your email.",
            });
          }
        });
      } else if (status) {
        res.status(200).json({ success: true });
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error });
  }
});

const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email, password);
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Please enter all fields properly!" });
  } else {
    const user = await User.findOne({ email: email }).populate("roleId");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    } else {
      const decryptPassword = decrypt(user.password);

      if (decryptPassword !== password) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid credentials" });
      } else {
        // if(!user.isEmailVerified){
        //     sendEmailVerification(email,function(error){
        //         if(error){
        //             return res.status(500).json({success:false,error:error})
        //         }else{
        //             res.status(200).json({success:true,user:user})
        //         }
        //     })
        // }else{
        return sendToken(user, 200, res);
        // }
      }
    }
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

const setProfileImage = catchAsyncErrors(async (req, res, next) => {
  try {
    const UserId = req.user._id;
    const filePath = req.files[0].path;
    const fileName = req.files[0].filename;
    const { update } = req.body;

    const bucketName = process.env.AWS_USER_IMAGE_BUCKET_NAME;
    const region = process.env.AWS_BUCKET_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY;
    const secretAccessKey = process.env.AWS_SECRET_KET;

    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region,
    });

    const s3 = new AWS.S3();

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: fs.createReadStream(filePath),
    };

    const s3UploadResponse = await s3.upload(uploadParams).promise();

    // Now you can save the S3 file URL and other details to your database
    const s3FileUrl = s3UploadResponse.Location;

    const userImage = s3FileUrl;
    const present = await User.findOne({ UserId: new ObjectId(UserId) });
    if (update && present) {
      await User.updateOne(
        { UserId: new ObjectId(UserId) },
        { $set: { userImage: userImage } }
      );
    } else {
      const profileImage = new User({
        UserId,
        userImage,
      });
      await profileImage.save();
    }
    // Remove the temporary file from the server
    fs.unlinkSync(filePath);

    // Respond to the client
    res.status(200).json({ message: "File uploaded and saved successfully" });
  } catch (error) {
    res.status(200).json({ error: "Internal server error" });
  }
});

module.exports = {
  login,
  register,
  emailVerification,
  myProfile,
  logout,
  setProfile,
  setProfileImage,
};
