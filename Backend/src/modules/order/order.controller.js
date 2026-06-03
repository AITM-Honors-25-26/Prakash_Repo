import * as OrderService from './order.service.js';

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

// ... existing imports and functions

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