import Joi from "joi";

export const RegisterUserDTO = Joi.object({
  fullname: Joi.string().min(2).max(50).required().messages({
      "string.base": "Full name must be a text value",
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 2 characters long",
      "string.max": "Full name must be less than or equal to 50 characters",
      "any.required": "Full name is required"
    }),
  email: Joi.string().email().required().messages({
      "string.base": "Email must be a text value",
      "string.empty": "Email is required",
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required"
    }),
  password: Joi.string().pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*_.-])[A-Za-z\d!@#$%^&*_.-]{8,25}$/).required().messages({
      "string.base": "Password must be a text value",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8–25 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character",
      "any.required": "Password is required"
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
      "string.empty": "Confirm password is required",
      "any.only": "Confirm password must match the password",
      "any.required": "Confirm password is required"
    }),
  address: Joi.string().allow(null, "").messages({
      "string.base": "Address must be a text value"
    }),
  role: Joi.string().valid("admin", "chef", "waiter").default("admin").messages({
      "string.base": "Role must be a text value",
      "any.only": "Role must be either admin, chef, or waiter"
    }),
  phone: Joi.string().min(10).max(20).messages({
      "string.base": "Phone number must be a text value",
      "string.min": "Phone number must be at least 10 digits",
      "string.max": "Phone number must be at most 20 digits"
    }),
  gender: Joi.string().valid("male", "female", "other").messages({
      "string.base": "Gender must be a text value",
      "any.only": "Gender must be male, female, or other"
    })
});
