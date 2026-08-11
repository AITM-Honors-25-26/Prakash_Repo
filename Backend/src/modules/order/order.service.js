import Order from '../ordermodel/order.model.js';
import { OrderStatus, PaymentStatus } from '../../config/constants.js';
import settingsSvc from '../settings/settings.service.js';
import tableSvc from '../table/table.service.js';
import membershipSvc from '../membership/membership.service.js';

export const createOrder = async (orderData) => {
  const { tableNumber, items, discountCode, membershipPhone, membershipEmail } = orderData;

  const subtotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const member = (membershipPhone || membershipEmail)
    ? await membershipSvc.lookupVerifiedMember({ phone: membershipPhone, email: membershipEmail })
    : null;

  const totals = await settingsSvc.calculateOrderTotals(subtotal, discountCode, member);

  const newOrder = new Order({
    tableNumber,
    items,
    subtotal: totals.subtotal,
    discountCode: totals.discountCode,
    discountAmount: totals.discountAmount,
    membershipId: member ? member._id : null,
    membershipPhone: member?.phone || null,
    membershipEmail: member?.email || null,
    membershipTier: totals.membershipTier,
    membershipDiscountPercent: totals.membershipDiscountPercent,
    membershipDiscountAmount: totals.membershipDiscountAmount,
    taxRate: totals.taxRate,
    taxAmount: totals.taxAmount,
    serviceChargeRate: totals.serviceChargeRate,
    serviceChargeAmount: totals.serviceChargeAmount,
    totalPrice: totals.totalPrice,
    status: OrderStatus.PENDING
  });

  const savedOrder = await newOrder.save();

  if (member) {
    await membershipSvc.incrementVisit(member._id);
  }

  await tableSvc.refreshTableBilling(tableNumber);

  return savedOrder;
};

export const getOrdersForKitchen = async () => {
  return await Order.find({
    status: { $nin: [OrderStatus.CANCELLED] },
    isCleared: false
  }).sort({ createdAt: 1 });
};

export const getActiveOrdersForTable = async (tableNumber) => {
  return await Order.find({
    tableNumber,
    status: { $nin: [OrderStatus.CANCELLED] },
    isCleared: false
  }).sort({ createdAt: 1 });
};

export const updateOrderItems = async (orderId, { items, discountCode, membershipPhone, membershipEmail }) => {
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

  const member = (membershipPhone || membershipEmail)
    ? await membershipSvc.lookupVerifiedMember({ phone: membershipPhone, email: membershipEmail })
    : order.membershipId ? await membershipSvc.lookupVerifiedMember({
        phone: order.membershipPhone,
        email: order.membershipEmail
      }) : null;

  const totals = await settingsSvc.calculateOrderTotals(subtotal, effectiveDiscountCode, member);

  order.items = items;
  order.subtotal = totals.subtotal;
  order.discountCode = totals.discountCode;
  order.discountAmount = totals.discountAmount;
  order.membershipId = member ? member._id : null;
  order.membershipPhone = member?.phone || null;
  order.membershipEmail = member?.email || null;
  order.membershipTier = totals.membershipTier;
  order.membershipDiscountPercent = totals.membershipDiscountPercent;
  order.membershipDiscountAmount = totals.membershipDiscountAmount;
  order.taxRate = totals.taxRate;
  order.taxAmount = totals.taxAmount;
  order.serviceChargeRate = totals.serviceChargeRate;
  order.serviceChargeAmount = totals.serviceChargeAmount;
  order.totalPrice = totals.totalPrice;

  const savedOrder = await order.save();

  await tableSvc.refreshTableBilling(savedOrder.tableNumber);

  return savedOrder;
};

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
  const savedOrder = await order.save();

  await tableSvc.refreshTableBilling(savedOrder.tableNumber);

  return savedOrder;
};

export const updateStatus = async (orderId, newStatus) => {
  return await Order.findByIdAndUpdate(
    orderId,
    { status: newStatus },
    { new: true, runValidators: true }
  );
};

export const deleteOrder = async (orderId) => {
  const order = await Order.findById(orderId);

  await Order.findByIdAndDelete(orderId);

  if (order?.tableNumber) {
    await tableSvc.refreshTableBilling(order.tableNumber);
  }

  return order;
};

export const getOrderById = async (orderId) => {
  return await Order.findById(orderId);
};

export const setPaymentStatus = async (orderId, paymentStatus, extra = {}) => {
  const order = await Order.findById(orderId);

  if (!order) return null;

  const wasPaid = order.paymentStatus === PaymentStatus.PAID;
  const updates = { paymentStatus, ...extra };

  if (paymentStatus === PaymentStatus.PAID) {
    updates.paidAt = new Date();
  }

  const updated = await Order.findByIdAndUpdate(
    orderId,
    updates,
    { new: true, runValidators: true }
  );

  if (!wasPaid && paymentStatus === PaymentStatus.PAID && updated?.membershipId) {
    await membershipSvc.recordPayment(updated.membershipId, updated.totalPrice);
  }

  if (updated?.tableNumber) {
    await tableSvc.refreshTableBilling(updated.tableNumber);
  }

  return updated;
};
