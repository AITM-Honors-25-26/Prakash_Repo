import express from 'express';
import { 
  createOrder, 
  getKitchenOrders, 
  updateOrderStatus, 
  deleteOrder, 
  getOrderStatus,
  getUserOrders // NEW IMPORT
} from './order.controller.js';
import { validateCreateOrder, validateUpdateStatus } from './order.validator.js';
import allowUser from '../../middleware/auth.middelware.js';
import { UserRole } from '../../config/constants.js';

const orderRouter = express.Router();

orderRouter.post('/order/', validateCreateOrder, createOrder);

// NEW ROUTE: Fetch orders for the My Orders page
orderRouter.get('/order/user', getUserOrders);

orderRouter.get('/order/kitchen', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER]), getKitchenOrders);
orderRouter.get('/order/:id/status', getOrderStatus);
orderRouter.patch('/order/:id/status', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER]), validateUpdateStatus, updateOrderStatus);
orderRouter.delete('/order/:id', allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER]), deleteOrder);

export default orderRouter;