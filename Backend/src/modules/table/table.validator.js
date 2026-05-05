import Joi from "joi";

export const menuCreateSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        "string.empty": "Item name is required"
    }),
    description: Joi.string().required().messages({
        "string.empty": "Description is required"
    }),
    price: Joi.number().min(0).required().messages({
        "number.base": "Price must be a valid number",
        "number.min": "Price cannot be negative"
    }),
    category: Joi.string().valid('Cake', 'Bread', 'Pastry', 'Cookie', 'drinks').required().messages({
        "any.only": "Category must be Cake, Bread, Pastry, Cookie, or drinks"
    }),
    stock: Joi.number().min(0).optional().empty(''),
    isAvailable: Joi.boolean().optional().empty('')
});