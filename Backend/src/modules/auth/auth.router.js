import { Router } from "express";
import authCtr from "./auth.controller.js";
import { bodyValidator } from "../../middleware/request.validator.js";
import { ForgetPasswordRequestDTO, LoginDTO, RegisterUserDTO, CreateStaffDTO, UpdateStaffDTO } from "./auth.validator.js";
import { uploader } from "../../middleware/file-handeling.middleware.js";
import allowUser from "../../middleware/auth.middelware.js";
import { UserRole } from "../../config/constants.js";
const authRouter = Router();

authRouter.post('/auth/register',uploader().single('image'),bodyValidator(RegisterUserDTO), authCtr.registerUser)

authRouter.get('/auth/activater/:token', authCtr.activateUser);
authRouter.post('/auth/me',allowUser(),authCtr.getMyProfile);
authRouter.post('/auth/login',bodyValidator(LoginDTO),authCtr.loginUser);
authRouter.post('/auth/forgot_password',bodyValidator(ForgetPasswordRequestDTO),authCtr.forgotPassword);
authRouter.get('/auth/verify-token/:token', authCtr.verifyForgotPasswordToken)
authRouter.patch('/auth/reset-password',authCtr.resetPassword);

// --- Staff Account Management (Admin only) ---------------------------------
authRouter.get('/auth/staff', allowUser([UserRole.ADMIN]), authCtr.listStaff);
authRouter.post('/auth/staff', allowUser([UserRole.ADMIN]), uploader().single('image'), bodyValidator(CreateStaffDTO), authCtr.createStaff);
authRouter.patch('/auth/staff/:id', allowUser([UserRole.ADMIN]), bodyValidator(UpdateStaffDTO), authCtr.updateStaff);
authRouter.delete('/auth/staff/:id', allowUser([UserRole.ADMIN]), authCtr.deleteStaff);

export default authRouter;