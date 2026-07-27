import mongoose from "mongoose";
import { OrderStatus, PaymentStatus } from '../../config/constants.js';

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

  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.UNPAID
  },

  paymentMethod: {
    type: String,
    enum: ['Counter', 'Esewa'],
    default: 'Counter'
  },

  esewaTransactionCode: {
    type: String,
    default: null
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