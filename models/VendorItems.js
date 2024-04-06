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
  todayPurchasePrice:{
    type: Number,
    required: 'Cost Price is required',
},
});

module.exports = mongoose.model(
  "VendorItems",
  VendorItemsSchema,
  "VendorItems"
);
