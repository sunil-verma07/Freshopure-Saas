"use strict";

var mongoose = require("mongoose");

var StockSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true
  },
  stocks: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Items"
    },
    quantity: {
      type: {
        kg: {
          type: Number,
          "default": 0
        },
        gram: {
          type: Number,
          "default": 0
        },
        piece: {
          type: Number,
          "default": 0
        },
        packet: {
          type: Number,
          "default": 0
        }
      }
    }
  }]
}, {
  timestamps: true
});
module.exports = mongoose.model("Stocks", StockSchema, "Stocks");