const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },
    stocks: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Items" },
        price: Number,
        quantity: {
          type: {
            kg: { type: Number, default: 0 },
            gram: { type: Number, default: 0 },
            piece: { type: Number, default: 0 },
          },
        },
        waste: {
          type: {
            kg: { type: Number, default: 0 },
            gram: { type: Number, default: 0 },
            piece: { type: Number, default: 0 },
          },
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stocks", StockSchema, "Stocks");
