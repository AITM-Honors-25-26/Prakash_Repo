import mongoose from "mongoose";
import { OrderStatus } from './constants.js';

const OrderSchema = new mongoose.Schema({
  tableNumber: { 
    type: String, 
    required: true 
  },

  status: { 
    type: String, 
    enum: Object.values(OrderStatus), 
    default: OrderStatus.PENDING 
  },

  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true },
      specialNotes: { type: String, default: "" } 
    }
  ],

  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Order', OrderSchema);