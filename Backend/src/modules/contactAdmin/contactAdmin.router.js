// Backend/src/modules/contactAdmin/contactAdmin.router.js
import { Router } from "express";
import { contactAdminCtrl } from "./contactAdmin.controller.js";

const contactAdminRouter = Router();

contactAdminRouter.post('/conatctAdmin', contactAdminCtrl.submitContactMessage);

export default contactAdminRouter;