import express from 'express';
import { createOrder, getKitchenOrders, updateOrderStatus, updateOrderItems, cancelOrder, deleteOrder, getOrderStatus, getOrdersByTable } from './order.controller.js';
import { validateCreateOrder, validateUpdateStatus, validateUpdateItems } from './order.validator.js';
import allowUser from '../../middleware/auth.middelware.js';
import { UserRole } from '../../config/constants.js';

const orderRouter = express.Router();

orderRouter.post('/order/', validateCreateOrder, createOrder);
orderRouter.get('/order/kitchen', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER, UserRole.RECEPTION]), getKitchenOrders);

orderRouter.get('/order/table/:tableNumber/active', getOrdersByTable);

orderRouter.get('/order/:id/status', getOrderStatus);
orderRouter.patch('/order/:id/status', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER, UserRole.RECEPTION]), validateUpdateStatus, updateOrderStatus);

orderRouter.patch('/order/:id/items', validateUpdateItems, updateOrderItems);
orderRouter.patch('/order/:id/cancel', cancelOrder);

orderRouter.delete('/order/:id', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER, UserRole.RECEPTION]), deleteOrder);

export default orderRouter;
