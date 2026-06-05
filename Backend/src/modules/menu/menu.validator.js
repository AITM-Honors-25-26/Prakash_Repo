import Joi from "joi";
// Make sure this path matches wherever you saved your Category object!
import { Category } from "../../config/constants.js"; 

// Extract just the string values ('Bread', 'Cake', etc.) into an array
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
    
    // Use the spread operator (...) to pass the array values into .valid()
    category: Joi.string().valid(...validCategories).required().messages({
        // Dynamically join the categories so the error message always stays accurate
        "any.only": `Category must be one of: ${validCategories.join(', ')}`
    }),
    
    stock: Joi.number().min(0).optional().empty(''),
    isAvailable: Joi.boolean().optional().empty('')
});