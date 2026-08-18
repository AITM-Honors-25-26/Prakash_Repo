import * as OrderService from './order.service.js';

const toPublicOrder = (order) => ({
  _id: order._id,
  status: order.status,
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod,
  tableNumber: order.tableNumber,
  items: order.items,
  subtotal: order.subtotal,
  discountCode: order.discountCode,
  discountAmount: order.discountAmount,
  membershipTier: order.membershipTier,
  membershipDiscountPercent: order.membershipDiscountPercent,
  membershipDiscountAmount: order.membershipDiscountAmount,
  taxRate: order.taxRate,
  taxAmount: order.taxAmount,
  serviceChargeRate: order.serviceChargeRate,
  serviceChargeAmount: order.serviceChargeAmount,
  totalPrice: order.totalPrice,
  paidAt: order.paidAt,
  createdAt: order.createdAt,
});

export const createOrder = async (req, res) => {
  try {
    const newOrder = await OrderService.createOrder(req.body);

    const io = req.app.get('io');
    if (io) {
      io.emit('kitchen_new_order', newOrder);
    }

    return res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({ success: true, data: toPublicOrder(order) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrdersByTable = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const orders = await OrderService.getActiveOrdersForTable(tableNumber);

    return res.status(200).json({ success: true, data: orders.map(toPublicOrder) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getKitchenOrders = async (req, res) => {
  try {
    const activeOrders = await OrderService.getOrdersForKitchen();
    return res.status(200).json({ success: true, data: activeOrders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await OrderService.updateStatus(id, status);

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_updated', updatedOrder);
    }

    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, discountCode } = req.body;

    const updatedOrder = await OrderService.updateOrderItems(id, { items, discountCode });

    const io = req.app.get('io');
    if (io) {
      io.emit('order_items_updated', updatedOrder);
    }

    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const cancelledOrder = await OrderService.cancelOrder(id);

    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_updated', cancelledOrder);
    }

    return res.status(200).json({ success: true, data: cancelledOrder });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await OrderService.deleteOrder(id);

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_updated', { _id: id, status: 'Completed' });
    }

    return res.status(200).json({ success: true, message: 'Order permanently deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
