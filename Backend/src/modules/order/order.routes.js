import express from 'express';
import { createOrder, getKitchenOrders, updateOrderStatus } from './order.controller.js';
import { validateCreateOrder, validateUpdateStatus } from './order.validator.js';

const orderRouter = express.Router();

router.post('/', validateCreateOrder, createOrder);

router.get('/kitchen', getKitchenOrders);
router.patch('/:id/status', validateUpdateStatus, updateOrderStatus);

export default orderRouter;