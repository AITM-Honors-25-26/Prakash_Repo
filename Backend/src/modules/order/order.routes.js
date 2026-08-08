import express from 'express';
import { createOrder, getKitchenOrders, updateOrderStatus, updateOrderItems, cancelOrder, deleteOrder, getOrderStatus, getOrdersByTable } from './order.controller.js';
import { validateCreateOrder, validateUpdateStatus, validateUpdateItems } from './order.validator.js';
import allowUser from '../../middleware/auth.middelware.js';
import { UserRole } from '../../config/constants.js';

const orderRouter = express.Router();

orderRouter.post('/order/', validateCreateOrder, createOrder);
orderRouter.get('/order/kitchen', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER, UserRole.RECEPTION]), getKitchenOrders);

// Table Overview - all of a table's active orders together (see
// getOrdersByTable). Registered before '/order/:id/status' just for
// readability; Express doesn't care since the path shapes differ.
orderRouter.get('/order/table/:tableNumber/active', getOrdersByTable);

orderRouter.get('/order/:id/status', getOrderStatus);
orderRouter.patch('/order/:id/status', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER, UserRole.RECEPTION]), validateUpdateStatus, updateOrderStatus);

// Order Customization - public/unauthenticated on purpose, same as
// getOrderStatus above: the customer's own device (no login) edits or
// cancels their order from the Order Tracking page while it's still
// Pending. Staff can also hit these (e.g. a waiter adjusting an order).
orderRouter.patch('/order/:id/items', validateUpdateItems, updateOrderItems);
orderRouter.patch('/order/:id/cancel', cancelOrder);

orderRouter.delete('/order/:id', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER, UserRole.RECEPTION]), deleteOrder);

export default orderRouter;