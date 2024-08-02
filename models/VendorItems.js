const mongoose = require("mongoose");

const VendorItemsSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },


  items: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
      totalQuantity: {
        kg: { type: Number, default: 0 },
        gram: { type: Number, default: 0 },
        piece: { type: Number, default: 0 },
        packet: { type: Number, default: 0 },
      },
      totalPrice: {
        type: Number, 
        default: 0,
      },
      history: [
        {
          historyId: {
            type: mongoose.Schema.Types.ObjectId,
            default: new mongoose.Types.ObjectId,
            unique: true,
          },
          date: {
            type: Date,
            default: Date.now,
          },
          price: {
            type: Number,
            default: 0,
          },
          quantity: {
            kg: { type: Number, default: 0 },
            gram: { type: Number, default: 0 },
            piece: { type: Number, default: 0 },
            packet: { type: Number, default: 0 },
          },
        },
      ],
      waste: [
        {
          wasteId: {
            type: mongoose.Schema.Types.ObjectId,
            default: new mongoose.Types.ObjectId,
            unique: true,
          },
          date: {
            type: Date,
            default: Date.now,
          },
          quantity: {
            kg: { type: Number, default: 0 },
            gram: { type: Number, default: 0 },
            piece: { type: Number, default: 0 },
            packet: { type: Number, default: 0 },
          },
          reason: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("VendorItemsAndStock", VendorItemsSchema, "VendorItemsAndStock");
