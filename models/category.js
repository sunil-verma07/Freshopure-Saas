const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: "Category name is required",
  },
  img:{
    type: String,
    required: "Category image is required",   
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

module.exports = mongoose.model("Category", CategorySchema, "Category");
