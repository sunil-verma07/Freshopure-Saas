const mongoose = require("mongoose");
const Items = require("./item");
const User = require("./user");


const subVendorSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subVendorCode: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    unique:true
  },
  phone: {
    type: Number,
    unique: true,
    trim: true,
    required: "Mobile Number is required",
  },
  assignedItems: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Items" },
    },
  ],
});

const SubVendor = mongoose.model("SubVendor", subVendorSchema);

module.exports = SubVendor;
