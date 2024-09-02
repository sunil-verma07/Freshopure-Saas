const mongoose = require("mongoose");

const VendorCategorySchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  categories: [
    {
      name: {
        type: String,
      },
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    },
  ],
});

module.exports = mongoose.model(
  "VendorCategories",
  VendorCategorySchema,
  "VendorCategories"
);
