import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true,
  },

  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true },
      specialNotes: { type: String, default: "Default" } 
    }
  ],

  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },

  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'completed'],
    default: 'pending' 
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);