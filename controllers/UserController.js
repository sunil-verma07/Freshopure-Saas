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
const UserDetails = require('../models/userDetails.js') 
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
const {
  generateUniqueId,
  verifyUniqueId,
} = require("../services/uniqueIdVerification.js");

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
    // console.log(phone, code);
    const uniqueCode = await generateUniqueId();
    const encryptedCode = await encrypt(uniqueCode);

    const { message } = await verifyOtp(phone, code);

    if (message !== "OTP verified success") {
      return res.json({ success: false, message: message });
    } else {
      const user = await User.findOne({ phone: phone });

      if (!user) {
        const newUser = await User.create({
          uniqueId:encryptedCode,
          phone: phone,
          isProfileComplete: false,
          isReviewed: false,
          isApproved: false,
          hasActiveSubscription: false,
          dateOfActivation: null,
        });
        res.status(200).json({ success: true, user: newUser });
      } else {

        if (!user.isProfileComplete && !user.isReviewed && !user.isApproved) {
          return res.status(200).json({ success: true, user });
        } else {
          const userDetail = await UserDetails.findOne({userId:user._id})
          const roleId = await Role.findOne({ _id: userDetail.roleId });

          const result = await User.aggregate([
            { $match: { _id: user._id } },
            {
              $lookup: {
                from: 'UserDetails', // Name of the UserDetails collection
                localField: '_id',
                foreignField: 'userId',
                as: 'userDetails'
              }
            },
            { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } }, // Unwind the userDetails array
            {
              $addFields: {
                fullName: '$userDetails.fullName',
                email: '$userDetails.email',
                roleId: '$userDetails.roleId',
                organization: '$userDetails.organization',
              }
            },
            { $project: { userDetails: 0 } } 
          ]).exec();

          console.log(result,'user')

          return sendToken(result[0], 200, res, roleId.name);
        }
      }
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, error: error });
  }
});

const login = catchAsyncErrors(async (req, res, next) => {
  try {
    // console.log(req.body, "body");
    const { phone, code } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter your phone number!" });
    } else {
      if (!code) {
        await sendOtp(phone);
      } else if (code.length === 8) {
        const user = await User.findOne({ phone: phone });
        if (!user) {
          return res.status(400).json({
            success: false,
            error: "User not found!",
          });
        }

        const existingCode = await decrypt(user.uniqueId);
        const isUser = await verifyUniqueId(code, existingCode);

        const roleId = await Role.findOne({ _id: user.roleId });
        if (isUser) {
          return sendToken(user, 200, res, roleId.name);
        } else {
          return res.json({ success: false, message: "Incorrect UniqueId!" });
        }
      } else {
        return res.json({ success: false, error: "Please Recheck your code!" });
      }

      return res.status(200).json({ message: "OTP sent", otp: true });
    }
  } catch (error) {
    console.log(error, "err");
    return res.status(401).json({ message: "Failed to send OTP" });
  }
});

const resend = catchAsyncErrors(async (req, res, next) => {
  try {
    const { phone } = req.body;
    // console.log(phone);

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

const profileComplete = catchAsyncErrors(async (req, res, next) => {
  try {
    const { fullName, organization, role, email, phone } = req.body;

    if (!fullName || !organization || !role || !email || !phone) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter all fields properly!" });
    } else {
     
      const roleId = await Role.findOne({ name: role });
      const user = await User.findOne({ phone: phone });
      const userDetails = await UserDetails.findOne({userId:user._id})

      if(userDetails){
        return res
        .status(400)
        .json({ success: false, error: "Profile Already Completed" });     
      }else{
        const newProfile = new UserDetails({
          userId: user._id,
          fullName:fullName,
          email: email,
          organization: organization,
          roleId:roleId,
          }) 

          await newProfile.save();

          await User.findOneAndUpdate({ phone: phone },{ isProfileComplete: true,
            isReviewed:true,
            isApproved: true})


            const result = await User.aggregate([
              { $match: { _id: user._id } },
              {
                $lookup: {
                  from: 'UserDetails', // Name of the UserDetails collection
                  localField: '_id',
                  foreignField: 'userId',
                  as: 'userDetails'
                }
              },
              { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } }, // Unwind the userDetails array
              {
                $addFields: {
                  fullName: '$userDetails.fullName',
                  email: '$userDetails.email',
                  roleId: '$userDetails.roleId',
                  organization: '$userDetails.organization',
                }
              },
              { $project: { userDetails: 0 } } 
            ]).exec();

        return sendToken(result[0], 200, res, role);
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Internal Server Error" });
  }
});

const setProfileImage = catchAsyncErrors(async (req, res, next) => {
  try {
    // console.log(req, "req");
    const userId = req.user._id;
    const images = req.files;

    // console.log(images, "img");

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

  // console.log(image, "img");
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
  setProfileImage,
  userDetailUpdate,
  addUserDetails,
  profileComplete,
};
