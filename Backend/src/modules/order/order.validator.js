import { OrderStatus } from './constants.js';

export const validateCreateOrder = (req, res, next) => {
  const { tableNumber, items } = req.body;

  if (!tableNumber || typeof tableNumber !== 'string' || tableNumber.trim() === '') {
    return res.status(400).json({ success: false, message: 'A valid table number is required.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }

  for (const item of items) {
    if (!item.name || typeof item.name !== 'string') {
      return res.status(400).json({ success: false, message: 'Each item must have a valid name.' });
    }
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
      return res.status(400).json({ success: false, message: 'Each item quantity must be at least 1.' });
    }
    if (!item.price || typeof item.price !== 'number' || item.price < 0) {
      return res.status(400).json({ success: false, message: 'Each item must have a valid positive price.' });
    }
  }

  next();
};

export const validateUpdateStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = Object.values(OrderStatus);

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  next();
};