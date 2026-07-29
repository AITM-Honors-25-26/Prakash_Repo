import Order from '../ordermodel/order.model.js';
import { OrderStatus } from '../../config/constants.js';

export const createOrder = async (orderData) => {
  // UPDATED: Now destructuring userId and sessionId
  const { tableNumber, items, userId, sessionId } = orderData;

  const totalPrice = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const newOrder = new Order({
    tableNumber,
    items,
    totalPrice,
    userId,        // NEW
    sessionId,     // NEW
    status: OrderStatus.PENDING
  });

  return await newOrder.save();
};

// NEW: Database query to find user/session orders
export const getUserOrders = async (query) => {
  return await Order.find(query).sort({ createdAt: -1 }); // Newest orders first
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

export const setPaymentStatus = async (orderId, paymentStatus, extra = {}) => {
  return await Order.findByIdAndUpdate(
    orderId,
    { paymentStatus, ...extra },
    { new: true, runValidators: true }
  );
};