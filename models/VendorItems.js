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
      todayCostPrice: {
        type: Number,
        default: 0,
      },
    },
  ],
});

module.exports = mongoose.model(
  "VendorItems",
  VendorItemsSchema,
  "VendorItems"
);
