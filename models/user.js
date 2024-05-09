const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};
const validatePhone = (phone) => {
  const re = /\d{10}/;
  return re.test(phone);
};

const UserSchema = new mongoose.Schema({
  organization: {
    type: String,
  },
  fullName: String,
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    validate: [validateEmail, "Please fill a valid email address"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
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
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    // required: "Please choose your role",
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
});

// JWT TOKEN
UserSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

//hashing password
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
