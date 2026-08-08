import { Router } from "express";
import membershipCtrl from "./membership.controller.js";
import { bodyValidator } from "../../middleware/request.validator.js";
import { requestOtpSchema, verifyOtpSchema, updateMemberSchema } from "./membership.validator.js";
import allowUser from "../../middleware/auth.middelware.js";
import { UserRole } from "../../config/constants.js";

const membershipRouter = Router();

// Public - enrollment + checkout flows (no login required for customers).
membershipRouter.post('/members/otp/request', bodyValidator(requestOtpSchema), membershipCtrl.requestOtp);
membershipRouter.post('/members/otp/verify', bodyValidator(verifyOtpSchema), membershipCtrl.verifyOtp);
membershipRouter.get('/members/lookup', membershipCtrl.lookup);

// Staff (Admin / Reception) - membership directory & management.
membershipRouter.get('/members', allowUser([UserRole.ADMIN, UserRole.RECEPTION]), membershipCtrl.list);
membershipRouter.patch('/members/:id', allowUser([UserRole.ADMIN]), bodyValidator(updateMemberSchema), membershipCtrl.update);
membershipRouter.delete('/members/:id', allowUser([UserRole.ADMIN]), membershipCtrl.remove);

export default membershipRouter;
