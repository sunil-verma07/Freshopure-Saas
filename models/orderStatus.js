const mongoose = require('mongoose');

const orderStatusSchema = new mongoose.Schema(
  {
    status:{type:String}
  }
);

const OrderStatus = mongoose.model('OrderStatus', orderStatusSchema);

module.exports = OrderStatus;
