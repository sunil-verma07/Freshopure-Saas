const mongoose = require('mongoose');

const paymentPlanSchema = new mongoose.Schema(

  {
    name: String,
    duration: Number, 
    features: [String],
    price: Number,
  }
);

const PaymentPlan = mongoose.model('PaymentPlan', paymentPlanSchema);

module.exports = PaymentPlan;