import Joi from "joi";

export const tableCreateSchema = Joi.object({
    tableNumber: Joi.number().min(1).required().messages({
        "number.base": "Table number must be a valid number",
        "any.required": "Table number is required",
        "number.min": "Table number must be 1 or greater"
    }),
    
    capacity: Joi.number().min(1).required().messages({
        "number.base": "Capacity must be a valid number",
        "any.required": "Capacity is required",
        "number.min": "Capacity must be at least 1 person"
    }),
    
    status: Joi.string().valid('Available', 'Occupied', 'Reserved', 'NotAvailable').optional().empty('').messages({
        "any.only": "Status must be 'Available', 'Occupied', 'Reserved', or 'NotAvailable'"
    }),
    
    location: Joi.string().valid('Indoor', 'Outdoor', 'Window', 'Balcony').optional().empty('').messages({
        "any.only": "Location must be 'Indoor', 'Outdoor', 'Window', or 'Balcony'"
    }),

    email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid admin email",
        "any.required": "Email is required for verification"
    }),
    
    password: Joi.string().required().messages({
        "any.required": "Password is required for security verification"
    })
});