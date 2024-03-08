const mongoose = require("mongoose");

const VendorItemsSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
  },
});

module.exports = mongoose.model(
  "VendorItems",
  VendorItemsSchema,
  "VendorItems"
);
