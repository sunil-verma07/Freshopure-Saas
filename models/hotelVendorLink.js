const mongoose = require("mongoose");

const HotelVendorLinkSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isActive: {
    type: Boolean,
    required: "Active Status is required",
  },
  isPriceFixed: {
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model(
  "HotelVendorLink",
  HotelVendorLinkSchema,
  "HotelVendorLink"
);
