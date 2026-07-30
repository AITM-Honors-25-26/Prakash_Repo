import * as OrderService from './order.service.js';
import jwt from 'jsonwebtoken';

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

// NEW: Fetch orders for a specific user or guest session
export const getUserOrders = async (req, res) => {
  try {
    const { tableNumber, sessionId } = req.query;
    let query = {};

    // 1. Try to identify by token if the user is logged in
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Decode token to get user ID (ensure process.env.ACCESS_TOKEN_SECRET matches your actual env variable)
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET); 
        query.userId = decoded.id || decoded._id; 
      } catch (err) {
        console.log("Guest access or invalid token.");
      }
    }

    // 2. Fall back to guest tracking (tableNumber & sessionId)
    if (!query.userId) {
      if (sessionId) query.sessionId = sessionId;
      if (tableNumber) query.tableNumber = tableNumber;
    }

    // 3. Prevent fetching ALL orders if no params are passed
    if (Object.keys(query).length === 0) {
      return res.status(400).json({ success: false, message: 'Missing user or table identification.' });
    }

    const orders = await OrderService.getUserOrders(query);
    
    return res.status(200).json({ success: true, data: orders });
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

    return res.status(200).json({
      success: true,
      data: {
        _id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        tableNumber: order.tableNumber,
      },
    });
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