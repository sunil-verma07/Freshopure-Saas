"use strict";

var mongoose = require("mongoose");

var StockSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
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
      piece: Number
    }
  }]
});
module.exports = mongoose.model("Stocks", StockSchema, "Stocks");