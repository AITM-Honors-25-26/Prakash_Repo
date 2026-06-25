import { Router } from "express";
import authRouter from "../modules/auth/auth.router.js";
import menuRouter from "../modules/menu/menu.router.js"; 
import tableRouter from "../modules/table/table.router.js";
import orderRouter from "../modules/order/order.routes.js";
import contactAdminRouter from "../modules/contactAdmin/contactAdmin.router.js";

const router = Router();

router.use(authRouter);
router.use(menuRouter);
router.use(tableRouter);
router.use(orderRouter);
router.use(contactAdminRouter)

export default router;