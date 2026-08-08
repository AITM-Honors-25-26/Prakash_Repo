import { OrderStatus } from '../../config/constants.js';

// Shared by create-order and update-items: returns an error message string,
// or null if the items array is well-formed.
const validateItemsShape = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return 'Order must contain at least one item.';
  }

  for (const item of items) {
    if (!item.name || typeof item.name !== 'string') {
      return 'Each item must have a valid name.';
    }
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
      return 'Each item quantity must be at least 1.';
    }
    if (!item.price || typeof item.price !== 'number' || item.price < 0) {
      return 'Each item must have a valid positive price.';
    }
    if (item.specialNotes !== undefined && typeof item.specialNotes !== 'string') {
      return 'Special instructions must be a valid text value.';
    }
    if (item.selectedAddOns !== undefined) {
      if (!Array.isArray(item.selectedAddOns)) {
        return 'Selected add-ons must be a list.';
      }
      for (const addOn of item.selectedAddOns) {
        if (!addOn || typeof addOn.name !== 'string' || typeof addOn.price !== 'number' || addOn.price < 0) {
          return 'Each selected add-on must have a valid name and price.';
        }
      }
    }
  }

  return null;
};

export const validateCreateOrder = (req, res, next) => {
  const { tableNumber, items } = req.body;

  if (!tableNumber || typeof tableNumber !== 'string' || tableNumber.trim() === '') {
    return res.status(400).json({ success: false, message: 'A valid table number is required.' });
  }

  if (req.body.discountCode !== undefined && req.body.discountCode !== null && typeof req.body.discountCode !== 'string') {
    return res.status(400).json({ success: false, message: 'Discount code must be a valid text value.' });
  }

  if (req.body.membershipPhone !== undefined && req.body.membershipPhone !== null && typeof req.body.membershipPhone !== 'string') {
    return res.status(400).json({ success: false, message: 'Membership phone must be a valid text value.' });
  }

  if (req.body.membershipEmail !== undefined && req.body.membershipEmail !== null && typeof req.body.membershipEmail !== 'string') {
    return res.status(400).json({ success: false, message: 'Membership email must be a valid text value.' });
  }

  const itemsError = validateItemsShape(items);
  if (itemsError) {
    return res.status(400).json({ success: false, message: itemsError });
  }

  next();
};

// Order Customization - validates the body for PATCH /order/:id/items.
// The Pending-only enforcement itself lives in order.service.updateOrderItems,
// since it needs to check the order's current status in the DB.
export const validateUpdateItems = (req, res, next) => {
  const { items, discountCode } = req.body;

  if (discountCode !== undefined && discountCode !== null && typeof discountCode !== 'string') {
    return res.status(400).json({ success: false, message: 'Discount code must be a valid text value.' });
  }

  if (req.body.membershipPhone !== undefined && req.body.membershipPhone !== null && typeof req.body.membershipPhone !== 'string') {
    return res.status(400).json({ success: false, message: 'Membership phone must be a valid text value.' });
  }

  if (req.body.membershipEmail !== undefined && req.body.membershipEmail !== null && typeof req.body.membershipEmail !== 'string') {
    return res.status(400).json({ success: false, message: 'Membership email must be a valid text value.' });
  }

  const itemsError = validateItemsShape(items);
  if (itemsError) {
    return res.status(400).json({ success: false, message: itemsError });
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