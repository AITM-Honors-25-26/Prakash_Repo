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
      // Reference back to the Bakery item, when available, so kitchen/staff
      // views and reporting can look up the original item if needed.
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Bakery", default: null },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },

      // Order Customization: unit price already includes any selected
      // add-ons (basePrice + sum of selectedAddOns), so existing totals math
      // (price * quantity) keeps working unchanged.
      basePrice: { type: Number, default: null },
      selectedAddOns: [{
        name: { type: String },
        price: { type: Number, default: 0 }
      }],

      price: { type: Number, required: true },
      specialNotes: { type: String, default: "" }
    }
  ],

  // Bill breakdown - computed server-side (see settings.service.js) from the
  // restaurant's Tax & Discount Configuration at the time the order was
  // placed, so historical orders keep the rate that actually applied to them.
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

  // Grand total actually charged (subtotal - discount + tax + service charge).
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