import Order from './Order.js'; // Your Mongoose model
import { OrderStatus } from './constants.js';


export const createOrder = async (orderData) => {
  const { tableNumber, items } = orderData;

  const totalPrice = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const newOrder = new Order({
    tableNumber,
    items,
    totalPrice,
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