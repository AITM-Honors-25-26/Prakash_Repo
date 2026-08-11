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
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Bakery", default: null },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },

      basePrice: { type: Number, default: null },
      selectedAddOns: [{
        name: { type: String },
        price: { type: Number, default: 0 }
      }],

      price: { type: Number, required: true },
      specialNotes: { type: String, default: "" }
    }
  ],

  subtotal: {
    type: Number,
    default: 0
  },
  discountCode: {
    type: String,
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  serviceChargeRate: {
    type: Number,
    default: 0
  },
  serviceChargeAmount: {
    type: Number,
    default: 0
  },

  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },

  paidAt: {
    type: Date,
    default: null
  },

  isCleared: {
    type: Boolean,
    default: false
  },

  membershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Membership",
    default: null
  },
  membershipPhone: {
    type: String,
    default: null
  },
  membershipEmail: {
    type: String,
    default: null
  },
  membershipTier: {
    type: String,
    default: null
  },
  membershipDiscountPercent: {
    type: Number,
    default: 0
  },
  membershipDiscountAmount: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Order', OrderSchema);
