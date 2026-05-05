import { Router } from "express";
import menuCtrl from "./menu.controller.js";
import { menuCreateSchema } from "./menu.validator.js";
import { bodyValidator } from "../../middleware/request.validator.js";
import { uploader } from "../../middleware/file-handeling.middleware.js";
import allowUser from "../../middleware/auth.middelware.js";
import { UserRole } from "../../config/constants.js";

const menuRouter = Router();

menuRouter.post('/menu/add-item',allowUser([UserRole.ADMIN]),uploader().single('image'),bodyValidator(menuCreateSchema),menuCtrl.createBakeryItem);
menuRouter.get('/menu/list', menuCtrl.getAllMenuItems);
// Add this to your existing menuRouter file
menuRouter.delete('/menu/:id', allowUser([UserRole.ADMIN]), menuCtrl.deleteMenuItem);
export default menuRouter;