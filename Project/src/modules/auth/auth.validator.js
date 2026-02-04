import Joi from "joi"
const RegisterUserDTO = Joi.object({
    fullname:Joi.string().min(2).max(50).required(),
    email:Joi.string().email().required(),
    password:Joi.string().required(),
    confirmPassword:Joi.string().equal(Joi.ref('password')).required(),
    address:Joi.string().allow(null,''),
    role:Joi.string(),
    phone:Joi.string().min(10).max(20),
    gender:Joi.string()
});