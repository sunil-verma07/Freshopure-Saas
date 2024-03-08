const mongoose = require("mongoose");
const Items = require("./item");
const User = require("./user");

const validatePhone = (phone) => {
  const re = /\d{10}/;
  return re.test(phone);
};

const subVendorSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fullName: { type: String },
  phone: {
    type: Number,
    unique: true,
    unique: true,
    trim: true,
    required: "Mobile Number is required",
    validate: [validatePhone, "Please fill a valid Mobile Number"],
    match: [
      /^ (\+\d{ 1, 2}\s) ?\(?\d{ 3 } \)?[\s.-] ?\d{ 3 } [\s.-] ?\d{ 4 } $/,
      "Please fill a valid mobile number",
    ],
  },
  assignedItems: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Items" },
    },
  ],
});

const SubVendor = mongoose.model("SubVendor", subVendorSchema);

module.exports = SubVendor;
