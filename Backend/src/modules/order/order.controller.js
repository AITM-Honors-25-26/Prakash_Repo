import * as OrderService from './order.service.js';

// Shared by getOrderStatus and getOrdersByTable - trims an order down to the
// fields safe to expose on an unauthenticated customer-facing endpoint.
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
  taxRate: order.taxRate,
  taxAmount: order.taxAmount,
  serviceChargeRate: order.serviceChargeRate,
  serviceChargeAmount: order.serviceChargeAmount,
  totalPrice: order.totalPrice,
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

// Public/unauthenticated on purpose - the checkout page polls this from the
// customer's own device (no login) while the eSewa QR modal is open, and the
// Order Tracking page uses it to render the live status + itemized bill.
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

// Table Overview - Order Customization's "Order More Items" flow can leave a
// table with several active orders at once; this lets the Order Tracking
// page show the customer their whole tab, not just the order they just
// placed. Public/unauthenticated, same reasoning as getOrderStatus above.
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
    console.log('>>> HIT updateOrderStatus');
    console.log('>>> id:', req.params.id);
    console.log('>>> status:', req.body.status);

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

// Order Customization - lets the customer (or staff) edit an order's items,
// but only while it's still Pending (see OrderService.updateOrderItems).
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

// Order Customization - lets the customer cancel their own order while it's
// still Pending (see OrderService.cancelOrder for the status guard).
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