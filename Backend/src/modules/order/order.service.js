import Order from '../ordermodel/order.model.js';
import { OrderStatus } from '../../config/constants.js';
import settingsSvc from '../settings/settings.service.js';

export const createOrder = async (orderData) => {
  const { tableNumber, items, discountCode } = orderData;

  const subtotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const totals = await settingsSvc.calculateOrderTotals(subtotal, discountCode);

  const newOrder = new Order({
    tableNumber,
    items,
    subtotal: totals.subtotal,
    discountCode: totals.discountCode,
    discountAmount: totals.discountAmount,
    taxRate: totals.taxRate,
    taxAmount: totals.taxAmount,
    serviceChargeRate: totals.serviceChargeRate,
    serviceChargeAmount: totals.serviceChargeAmount,
    totalPrice: totals.totalPrice,
    status: OrderStatus.PENDING
  });

  return await newOrder.save();
};

export const getOrdersForKitchen = async () => {
  return await Order.find({
    status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
  }).sort({ createdAt: 1 });
};

export const updateStatus = async (orderId, newStatus) => {
  return await Order.findByIdAndUpdate(
    orderId,
    { status: newStatus },
    { new: true, runValidators: true }
  );
};

export const deleteOrder = async (orderId) => {
  return await Order.findByIdAndDelete(orderId);
};

export const getOrderById = async (orderId) => {
  return await Order.findById(orderId);
};

// Used by the eSewa QR flow: init sets it to Pending while the customer is
// scanning/paying, the success/failure callback flips it to Paid/Failed.
export const setPaymentStatus = async (orderId, paymentStatus, extra = {}) => {
  return await Order.findByIdAndUpdate(
    orderId,
    { paymentStatus, ...extra },
    { new: true, runValidators: true }
  );
};