import Joi from "joi";

export const discountRuleSchema = Joi.object({
    _id: Joi.string().optional(),
    code: Joi.string().trim().uppercase().min(2).max(20).required().messages({
        "string.empty": "Discount code is required"
    }),
    label: Joi.string().allow('', null),
    type: Joi.string().valid('PERCENTAGE', 'FLAT').required().messages({
        "any.only": "Discount type must be either PERCENTAGE or FLAT"
    }),
    value: Joi.number().min(0).required().messages({
        "number.base": "Discount value must be a valid number",
        "number.min": "Discount value cannot be negative"
    }),
    minOrderAmount: Joi.number().min(0).default(0),
    isActive: Joi.boolean().default(true),
    expiresAt: Joi.date().allow(null),
    createdAt: Joi.any().strip(),
    updatedAt: Joi.any().strip()
});

export const updateBillingSettingsSchema = Joi.object({
    taxRate: Joi.number().min(0).max(100).messages({
        "number.min": "Tax rate cannot be negative",
        "number.max": "Tax rate cannot exceed 100%"
    }),
    serviceChargeRate: Joi.number().min(0).max(100).messages({
        "number.min": "Service charge rate cannot be negative",
        "number.max": "Service charge rate cannot exceed 100%"
    }),
    discounts: Joi.array().items(discountRuleSchema),
    membershipEnabled: Joi.boolean(),
    membershipTiers: Joi.array().items(Joi.object({
        _id: Joi.string().optional(),
        name: Joi.string().trim().min(1).max(50).required().messages({
            "string.empty": "Tier name is required"
        }),
        minVisits: Joi.number().min(0).required(),
        discountPercent: Joi.number().min(0).max(100).required(),
        maxDiscountAmount: Joi.number().min(0).required(),
        createdAt: Joi.any().strip(),
        updatedAt: Joi.any().strip()
    }))
}).min(1);

export const previewTotalsSchema = Joi.object({
    subtotal: Joi.number().min(0).required(),
    discountCode: Joi.string().allow('', null),
    membershipPhone: Joi.string().allow('', null),
    membershipEmail: Joi.string().email().allow('', null)
});
