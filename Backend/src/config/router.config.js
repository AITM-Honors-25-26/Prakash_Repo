import { Router } from "express";
import authRouter from "../modules/auth/auth.router.js";
import menuRouter from "../modules/menu/menu.router.js"; 
import tableRouter from "../modules/table/table.router.js";

const router = Router();

router.use(authRouter);
router.use(menuRouter);
router.use(tableRouter)

export default router;