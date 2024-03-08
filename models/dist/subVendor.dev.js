"use strict";

var _phone;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var mongoose = require("mongoose");

var Items = require("./item");

var User = require("./user");

var validatePhone = function validatePhone(phone) {
  var re = /\d{10}/;
  return re.test(phone);
};

var subVendorSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  fullName: {
    type: String
  },
  phone: (_phone = {
    type: Number,
    unique: true
  }, _defineProperty(_phone, "unique", true), _defineProperty(_phone, "trim", true), _defineProperty(_phone, "required", "Mobile Number is required"), _defineProperty(_phone, "validate", [validatePhone, "Please fill a valid Mobile Number"]), _defineProperty(_phone, "match", [/^ (\+\d{ 1, 2}\s) ?\(?\d{ 3 } \)?[\s.-] ?\d{ 3 } [\s.-] ?\d{ 4 } $/, "Please fill a valid mobile number"]), _phone),
  assignedItems: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Items"
    }
  }]
});
var SubVendor = mongoose.model("SubVendor", subVendorSchema);
module.exports = SubVendor;