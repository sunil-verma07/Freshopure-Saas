"use strict";

var _phone;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
  organization: {
    type: String
  },
  fullName: String,
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: "Email address is required",
    validate: [validateEmail, "Please fill a valid email address"],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
  },
  phone: (_phone = {
    type: Number,
    unique: true
  }, _defineProperty(_phone, "unique", true), _defineProperty(_phone, "trim", true), _defineProperty(_phone, "required", "Mobile Number is required"), _defineProperty(_phone, "validate", [validatePhone, "Please fill a valid Mobile Number"]), _defineProperty(_phone, "match", [/^ (\+\d{ 1, 2}\s) ?\(?\d{ 3 } \)?[\s.-] ?\d{ 3 } [\s.-] ?\d{ 4 } $/, "Please fill a valid mobile number"]), _phone),
  password: {
    type: String,
    required: "Please enter your password"
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: "Please choose your role"
  },
  isEmailVerified: {
    type: Boolean,
    "default": false
  },
  isReviewed: {
    type: Boolean,
    "default": false
  },
  isApproved: {
    type: String
  }
}); // JWT TOKEN

UserSchema.methods.getJWTToken = function () {
  return jwt.sign({
    id: this._id
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
}; //hashing password


UserSchema.pre("save", function _callee(next) {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!this.isModified("password")) {
            next();
          }

          this.password = bcrypt.hash(this.password, 10);

        case 2:
        case "end":
          return _context.stop();
      }
    }
  }, null, this);
}); //comparing password

UserSchema.methods.comparePassword = function _callee2(password) {
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(bcrypt.compare(password, this.password));

        case 2:
          return _context2.abrupt("return", _context2.sent);

        case 3:
        case "end":
          return _context2.stop();
      }
    }
  }, null, this);
};

module.exports = mongoose.model("User", UserSchema, "Users");