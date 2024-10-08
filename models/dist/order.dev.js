"use strict";

var mongoose = require("mongoose");

var Items = require("./item.js");

var OrderStatus = require("./orderStatus.js");

var User = require("./user");

var HotelOrdersSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true // Corrected typo here

  },
  orderNumber: String,
  isReviewed: {
    type: Boolean,
    "default": false
  },
  orderStatus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "OrderStatus"
  },
  totalPrice: Number,
  address: {
    addressLine1: String,
    addressLine2: String,
    state: String,
    city: String,
    pinCode: Number
  },
  orderedItems: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Items"
    },
    price: Number,
    quantity: {
      kg: Number,
      gram: Number,
      piece: Number,
      packet: Number,
      litre: Number
    },
    unit: {
      type: String
    }
  }],
  isItemAdded: {
    type: Boolean,
    "default": false
  },
  itemAdded: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Items"
    },
    price: Number,
    quantity: {
      kg: Number,
      gram: Number,
      piece: Number,
      packet: Number,
      litre: Number
    }
  }]
}, {
  timestamps: true
});
var Order = mongoose.model("Orders", HotelOrdersSchema);
module.exports = Order;