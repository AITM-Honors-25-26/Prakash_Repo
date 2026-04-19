import { Router } from "express";
import authRouter from "../modules/auth/auth.router.js";
import menuRouter from "../modules/menu/menu.router.js"; 

const router = Router();

router.use(authRouter);
router.use(menuRouter);

export default router;