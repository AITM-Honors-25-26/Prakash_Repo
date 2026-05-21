import express from 'express';
import { createOrder, getKitchenOrders, updateOrderStatus } from './order.controller.js';
import { validateCreateOrder, validateUpdateStatus } from './order.validator.js';
import allowUser from '../../middleware/auth.middelware.js'; 
import { UserRole } from '../../config/constants.js';

const orderRouter = express.Router();

orderRouter.post('/order/',validateCreateOrder,createOrder);
orderRouter.get('/order/kitchen',allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER]),getKitchenOrders);
orderRouter.patch('/order/:id/status',allowUser([UserRole.ADMIN, UserRole.CHEF, UserRole.WAITER]),validateUpdateStatus,updateOrderStatus
);

export default orderRouter;