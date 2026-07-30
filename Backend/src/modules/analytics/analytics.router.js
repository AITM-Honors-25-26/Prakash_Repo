import { Router } from "express";
import analyticsCtrl from "./analytics.controller.js";
import allowUser from "../../middleware/auth.middelware.js";
import { UserRole } from "../../config/constants.js";

const analyticsRouter = Router();

analyticsRouter.get('/analytics/overview', allowUser([UserRole.ADMIN]), analyticsCtrl.getOverview);
analyticsRouter.get('/analytics/sales-trend', allowUser([UserRole.ADMIN]), analyticsCtrl.getSalesTrend);
analyticsRouter.get('/analytics/top-items', allowUser([UserRole.ADMIN]), analyticsCtrl.getTopItems);

export default analyticsRouter;
