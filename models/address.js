const mongoose = require('mongoose');
const User = require("./user");

const addressSchema = new mongoose.Schema(
  {
    UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addressLine1: { type: String },
    addressLine2: { type: String },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pinCode: { type: Number, required: true },
    selected: { type: Boolean, default: true }
  }
);

const Address = mongoose.model('addresses', addressSchema);

module.exports = Address;
