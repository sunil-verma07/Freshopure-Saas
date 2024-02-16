const mongoose = require('mongoose');

const HotelItemPriceSchema = new mongoose.Schema({
    hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
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

module.exports = mongoose.model('HotelItemPrice', HotelItemPriceSchema, 'HotelItemPrice');