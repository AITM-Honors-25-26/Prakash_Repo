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
    }),

    // Optional profile details saved only after the OTP is confirmed, so a
    // customer can set up their name / details without staff involvement.
    fullName: Joi.string().allow("", null).max(100).messages({
        "string.max": "Name must be 100 characters or fewer"
    }),
    dob: Joi.string().allow("", null).pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
        "string.pattern.base": "Date of birth must be in YYYY-MM-DD format"
    }),
    gender: Joi.string().allow("", null).valid("Male", "Female", "Other").messages({
        "any.only": "Gender must be Male, Female or Other"
    }),
    address: Joi.string().allow("", null).max(200).messages({
        "string.max": "Address must be 200 characters or fewer"
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
    status: Joi.string().valid("Active", "Inactive"),
    dob: Joi.string().allow("", null).pattern(/^\d{4}-\d{2}-\d{2}$/),
    gender: Joi.string().allow("", null).valid("Male", "Female", "Other"),
    address: Joi.string().allow("", null).max(200)
}).min(1);
