"use strict";

var mongoose = require("mongoose"); // const { getDatabase } = require('../dbClient.js');
// const DefaultItems = require("./defaultItems.js");


var User = require("./user.js");

var Item = require("./item.js");

var hotelCartSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  cartItems: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item"
    },
    quantity: {
      kg: Number,
      gram: Number,
      piece: Number,
      packet: Number
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    unit: {
      type: String
    }
  }]
});
var Cart = mongoose.model("Carts", hotelCartSchema);
module.exports = Cart;