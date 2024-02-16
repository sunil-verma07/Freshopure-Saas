const mongoose = require('mongoose');
// const { getDatabase } = require('../dbClient.js');
const Items = require("./item.js");
// const db = getDatabase();
const address = require("./address.js");
// const statusForOrder = db.collection('OrderStatus');
// const okartmobile = db.collection('okartmobiles')
// const HotelAddress = require("./HotelAddress.js");
const OrderStatus = require("./orderStatus.js");
const User = require("./user");

const HotelOrdersSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true
  },
  orderNumber: String,
  isReviewed: { type: Boolean, default: false },
  orderStatus: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderStatus' },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'address' },
  orderedItems: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Items' },
      price:Number,
      quantity: {
        kg: Number,
        gram: Number,
        piece:Number
      }
    }
  ],
  isItemAdded:{type:Boolean,default:false},
  itemAdded:[
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Items' },
      price:Number,
      quantity: {
        kg: Number,
        gram: Number,
        piece:Number
      }
    }
  ],
},
  { timestamps: true });

const Order = mongoose.model('Orders', HotelOrdersSchema);

module.exports = Order;

 