const mongoose = require("mongoose");

const CompiledOrderSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  items: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
      },
      totalQuantity: {
        kg: Number,
        gram: Number,
        piece: Number,
        packet: Number,
        litre: Number
      },
      quantityToBeOrder:{
        kg: Number,
        gram: Number,
        piece: Number,
        packet: Number,
        litre: Number
      },
      purchasePrice:{
        type: Number,
        default: 0,
      },
      hotels: [
        {
          hotelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          quantity: {
            kg: Number,
            gram: Number,
            piece: Number,
            packet: Number,
            litre: Number
          },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("CompiledOrder", CompiledOrderSchema);
