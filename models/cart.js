const mongoose = require("mongoose");
// const { getDatabase } = require('../dbClient.js');
// const DefaultItems = require("./defaultItems.js");
const User = require("./user.js");
const Item = require("./item.js");

const hotelCartSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cartItems: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
      quantity: {
        kg: Number,
        gram: Number,
        piece: Number,
        packet: Number,
        litre: Number
      },
      vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      unit: {
        type: String,
      },
    },
  ],
});

const Cart = mongoose.model("Carts", hotelCartSchema);

module.exports = Cart;
