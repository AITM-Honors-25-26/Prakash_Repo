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

// Table Overview - every still-active order for one table (a table often
// places more than one order in a sitting, e.g. via "Order More Items").
// Used by: the customer's Order Tracking page (to show their whole tab, not
// just the last order placed) and available for the kitchen/waiter board to
// group by table too.
export const getActiveOrdersForTable = async (tableNumber) => {
  return await Order.find({
    tableNumber,
    status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
  }).sort({ createdAt: 1 });
};

// Order Customization after placement - the customer (or staff) may only
// change items while the kitchen hasn't started on the order yet. Once it's
// Preparing/Ready/Cancelled, this throws so the controller can return 409.
export const updateOrderItems = async (orderId, { items, discountCode }) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  if (order.status !== OrderStatus.PENDING) {
    const err = new Error('This order has already started preparing and can no longer be modified.');
    err.statusCode = 409;
    throw err;
  }

  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const effectiveDiscountCode = discountCode !== undefined ? discountCode : order.discountCode;
  const totals = await settingsSvc.calculateOrderTotals(subtotal, effectiveDiscountCode);

  order.items = items;
  order.subtotal = totals.subtotal;
  order.discountCode = totals.discountCode;
  order.discountAmount = totals.discountAmount;
  order.taxRate = totals.taxRate;
  order.taxAmount = totals.taxAmount;
  order.serviceChargeRate = totals.serviceChargeRate;
  order.serviceChargeAmount = totals.serviceChargeAmount;
  order.totalPrice = totals.totalPrice;

  return await order.save();
};

// Order Customization - lets the customer cancel their own order, but only
// while the kitchen hasn't started (mirrors the same rule as
// updateOrderItems above). Staff still has the unrestricted status-update
// and delete endpoints for cases after prep has begun.
export const cancelOrder = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  if (order.status !== OrderStatus.PENDING) {
    const err = new Error('This order has already started preparing and can no longer be cancelled. Please speak to a staff member.');
    err.statusCode = 409;
    throw err;
  }

  order.status = OrderStatus.CANCELLED;
  return await order.save();
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