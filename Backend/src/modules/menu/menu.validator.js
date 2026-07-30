import Joi from "joi";
import { Category } from "../../config/constants.js";

const validCategories = Object.values(Category);

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
    category: Joi.string().valid(...validCategories).required().messages({
        "any.only": `Category must be one of: ${validCategories.join(', ')}`
    }),
    stock: Joi.number().min(0).optional().empty(''),
    isAvailable: Joi.boolean().optional().empty(''),

    // Sent as a JSON string over multipart/form-data, e.g.
    // '[{"name":"Extra Cheese","price":50}]'. Parsed into an array in
    // menu.service.js#transformMenuData, same pattern used for images.
    addOns: Joi.string().optional().allow(''),

    email: Joi.string().email().required().messages({
        "string.empty": "Admin email is required"
    }),
    password: Joi.string().required().messages({
        "string.empty": "Admin password is required"
    })
});