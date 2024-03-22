const mongoose = require("mongoose");

const VendorCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: "Category name is required",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: "Created By is required",
  },
  isActive: {
    type: Boolean,
    required: "Category activity is required",
  },
});

module.exports = mongoose.model(
  "VendorCategory",
  VendorCategorySchema,
  "VendorCategory"
);
