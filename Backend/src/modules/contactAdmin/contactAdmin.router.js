// Backend/src/modules/contactAdmin/contactAdmin.router.js
import { Router } from "express";
import { contactAdminCtrl } from "./contactAdmin.controller.js";

const contactAdminRouter = Router();

// This sets up the POST route. 
contactAdminRouter.post('/', contactAdminCtrl.submitContactMessage);

export default contactAdminRouter;