const mongoose = require("mongoose")

const ImageSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
    },
    img: {
        type: String,
    },
    isDisplayImage: {
        type: Boolean,
        default: true,
    }
});

module.exports = new mongoose.model("Image", ImageSchema, "Images");