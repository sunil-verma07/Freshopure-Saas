const mongoose = require('mongoose');

const VendorItemsSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
    },
    todayCostPrice:{
        type: Number,
        required: 'Cost Price is required',
    },
    yesterdayCostPrice:{
        type: Number,
    },
    showPrice:{
        type: Boolean,
        default: true,
    }
})

module.exports = mongoose.model('VendorItems', VendorItemsSchema, 'VendorItems');