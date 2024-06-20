"use strict";

var mongoose = require("mongoose");

var bcrypt = require("bcryptjs");

var jwt = require("jsonwebtoken");

var validateEmail = function validateEmail(email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

var UserDetailsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  },
  fullName: String,
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role" // required: "Please choose your role",

  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: [validateEmail, "Please fill a valid email address"],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
  },
  organization: {
    type: String
  },
  img: {
    type: String
  },
  GSTnumber: {
    type: Number
  },
  FSSAInumber: {
    type: Number
  }
});
module.exports = mongoose.model("UserDetails", UserDetailsSchema, "UserDetails");