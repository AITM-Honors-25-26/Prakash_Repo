import { Router } from "express";
import settingsCtrl from "./settings.controller.js";
import { bodyValidator } from "../../middleware/request.validator.js";
import { updateBillingSettingsSchema } from "./settings.validator.js";
import allowUser from "../../middleware/auth.middelware.js";
import { UserRole } from "../../config/constants.js";

const settingsRouter = Router();

settingsRouter.get('/settings/billing', settingsCtrl.getBillingSettings);
settingsRouter.post('/settings/billing/preview', settingsCtrl.previewTotals);

settingsRouter.put('/settings/billing', allowUser([UserRole.ADMIN]), bodyValidator(updateBillingSettingsSchema), settingsCtrl.updateBillingSettings);

export default settingsRouter;
