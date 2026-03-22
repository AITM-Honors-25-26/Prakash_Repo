import { Router } from "express";
import authCtr from "./auth.controller.js";
import { bodyValidator } from "../../middleware/request.validator.js";
import { LoginDTO, RegisterUserDTO } from "./auth.validator.js";
import { uploader } from "../../middleware/file-handeling.middleware.js";
import allowUser from "../../middleware/auth.middelware.js";
const authRouter = Router();

authRouter.post('/auth/register',uploader().single('image'),bodyValidator(RegisterUserDTO), authCtr.registerUser)

authRouter.get('/auth/activater/:token', authCtr.activateUser);
authRouter.post('/auth/me',allowUser(),authCtr.getMyProfile);
authRouter.get('/auth/login',bodyValidator(LoginDTO),authCtr.loginUser);
authRouter.post('/auth/forgot_password',authCtr.forgotPassword);
authRouter.patch('/auth/reset-password/:token',authCtr.resetPassword);
export default authRouter;