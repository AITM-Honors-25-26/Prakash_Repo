import express from 'express';
import { createOrder, getKitchenOrders, updateOrderStatus } from './order.controller.js';
import { validateCreateOrder, validateUpdateStatus } from './order.validator.js';

const orderRouter = express.Router();

orderRouter.post('/order/', validateCreateOrder, createOrder);

orderRouter.get('/order/kitchen', getKitchenOrders);
orderRouter.patch('/order/:id/status', validateUpdateStatus, updateOrderStatus);

export default orderRouter;