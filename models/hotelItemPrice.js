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
    todayPercentageProfit:{
        type: Number,
        required: 'Percentage is required'
    },
    pastPercentageProfits: {
        type: [Number],
        validate: [arrayLimit, '{PATH} exceeds the limit of 10']
    },
    showPrice:{
        type: Boolean,
        default: true,
    }
})

function arrayLimit(val) {
    return val.length <= 10;
}

module.exports = mongoose.model('HotelItemPrice', HotelItemPriceSchema, 'HotelItemPrice');