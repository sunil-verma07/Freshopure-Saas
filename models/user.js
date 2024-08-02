const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const validatePhone = (phone) => {
  const re = /^\d{10}$/;
  return re.test(phone);
};

const UserSchema = new mongoose.Schema({
  phone: {
    type: Number,
    unique: true,
    trim: true,
    required: "Mobile Number is required",
    validate: [validatePhone, "Please fill a valid Mobile Number"],
    match: [
      /^\d{10}$/,
      "Please fill a valid mobile number",
    ],
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  isReviewed: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  hasActiveSubscription: { type: Boolean, default: false },
  activeSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentPlan",
  },
  paymentToken: {
    type: String,
  },
  dateOfActivation: { type: String, default: null },
  uniqueId: { type: String, unique: true },
});

// JWT TOKEN
UserSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = mongoose.model("User", UserSchema, "Users");
