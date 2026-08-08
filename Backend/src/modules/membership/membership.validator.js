import Joi from "joi";

export const requestOtpSchema = Joi.object({
    phone: Joi.string().allow("", null).messages({
        "string.base": "Phone number must be a text value"
    }),
    email: Joi.string().email().allow("", null).messages({
        "string.email": "Please enter a valid email address"
    })
}).custom((value, helpers) => {
    if (!value.phone && !value.email) {
        return helpers.error("any.required");
    }
    return value;
}, "at least one contact").messages({
    "any.required": "Provide either a phone number or an email address"
});

export const verifyOtpSchema = Joi.object({
    phone: Joi.string().allow("", null),
    email: Joi.string().email().allow("", null),
    otp: Joi.string().pattern(/^\d{6}$/).required().messages({
        "string.pattern.base": "The code must be exactly 6 digits",
        "string.empty": "The code is required",
        "any.required": "The code is required"
    })
}).custom((value, helpers) => {
    if (!value.phone && !value.email) {
        return helpers.error("any.required");
    }
    return value;
}, "at least one contact").messages({
    "any.required": "Provide either a phone number or an email address"
});

export const lookupMemberQuerySchema = Joi.object({
    phone: Joi.string().allow("", null),
    email: Joi.string().email().allow("", null)
}).custom((value, helpers) => {
    if (!value.phone && !value.email) {
        return helpers.error("any.required");
    }
    return value;
}, "at least one contact").messages({
    "any.required": "Provide either a phone number or an email address"
});

export const updateMemberSchema = Joi.object({
    fullName: Joi.string().min(1).max(100),
    phone: Joi.string().allow("", null),
    email: Joi.string().email().allow("", null),
    status: Joi.string().valid("Active", "Inactive")
}).min(1);
