import { Router } from "express";
import authRouter from "../modules/auth/auth.router.js";
import menuRouter from "../modules/menu/menu.router.js";
import tableRouter from "../modules/table/table.router.js";
import orderRouter from "../modules/order/order.routes.js";
import contactAdminRouter from "../modules/contactAdmin/contactAdmin.router.js";
import paymentRouter from "./payment/payment.router.js";
import settingsRouter from "../modules/settings/settings.router.js";
import analyticsRouter from "../modules/analytics/analytics.router.js";
import membershipRouter from "../modules/membership/membership.router.js";

const router = Router();

router.use(authRouter);
router.use(menuRouter);
router.use(tableRouter);
router.use(orderRouter);
router.use(contactAdminRouter)
router.use(paymentRouter)
router.use(settingsRouter)
router.use(analyticsRouter)
router.use(membershipRouter)

export default router;