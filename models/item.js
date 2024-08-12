const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Item Name is required',
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    description: {
        type: String,
    },
    unit: {
        type: String,
    },
    isActive: {
        type: Boolean,
        required: 'Item activity is required',
        default: true,
    }
});

module.exports = mongoose.model("Items", ItemSchema, "Items");
