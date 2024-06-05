"use strict";

var mongoose = require("mongoose");

var bcrypt = require("bcryptjs");

var jwt = require("jsonwebtoken");

var validateEmail = function validateEmail(email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

var validatePhone = function validatePhone(phone) {
  var re = /\d{10}/;
  return re.test(phone);
};

var UserSchema = new mongoose.Schema({
  uniqueId: {
    type: String // required: true,

  },
  organization: {
    type: String
  },
  fullName: String,
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: [validateEmail, "Please fill a valid email address"],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
  },
  phone: {
    type: Number,
    unique: true,
    trim: true,
    required: "Mobile Number is required",
    validate: [validatePhone, "Please fill a valid Mobile Number"],
    match: [/^ (\+\d{ 1, 2}\s) ?\(?\d{ 3 } \)?[\s.-] ?\d{ 3 } [\s.-] ?\d{ 4 } $/, "Please fill a valid mobile number"]
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role" // required: "Please choose your role",

  },
  isProfileComplete: {
    type: Boolean,
    "default": false
  },
  isReviewed: {
    type: Boolean,
    "default": false
  },
  isApproved: {
    type: Boolean,
    "default": false
  },
  hasActiveSubscription: {
    type: Boolean,
    "default": true
  },
  activeSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentPlan"
  },
  paymentToken: {
    type: String
  },
  dateOfActivation: {
    type: String,
    "default": null
  }
}); // JWT TOKEN

UserSchema.methods.getJWTToken = function () {
  return jwt.sign({
    id: this._id
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
}; //hashing password
// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     next();
//   }
//   this.password = bcrypt.hash(this.password, 10);
// });
//comparing password
// UserSchema.methods.comparePassword = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };


module.exports = mongoose.model("User", UserSchema, "Users");