import express from 'express';
import { createOrder, getKitchenOrders, updateOrderStatus, updateOrderItems, cancelOrder, deleteOrder, getOrderStatus } from './order.controller.js';
import { validateCreateOrder, validateUpdateStatus, validateUpdateItems } from './order.validator.js';
import allowUser from '../../middleware/auth.middelware.js';
import { UserRole } from '../../config/constants.js';

const orderRouter = express.Router();

orderRouter.post('/order/', validateCreateOrder, createOrder);
orderRouter.get('/order/kitchen', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER]), getKitchenOrders);
orderRouter.get('/order/:id/status', getOrderStatus);
orderRouter.patch('/order/:id/status', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER]), validateUpdateStatus, updateOrderStatus);

// Order Customization - public/unauthenticated on purpose, same as
// getOrderStatus above: the customer's own device (no login) edits or
// cancels their order from the Order Tracking page while it's still
// Pending. Staff can also hit these (e.g. a waiter adjusting an order).
orderRouter.patch('/order/:id/items', validateUpdateItems, updateOrderItems);
orderRouter.patch('/order/:id/cancel', cancelOrder);

orderRouter.delete('/order/:id', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER]), deleteOrder);

export default orderRouter;