import { Router } from "express";
import tableCtrl from "./table.controller.js";
import { tableCreateSchema } from "./table.validator.js"; 
import { bodyValidator } from "../../middleware/request.validator.js";
import allowUser from "../../middleware/auth.middelware.js";
import { UserRole } from "../../config/constants.js";

const tableRouter = Router();

tableRouter.post('/table/add',allowUser([UserRole.ADMIN]),bodyValidator(tableCreateSchema),tableCtrl.createTable);
tableRouter.get('/table/list',tableCtrl.getAllTables);
tableRouter.delete('/table/:id',allowUser([UserRole.ADMIN]),tableCtrl.deleteTable);

export default tableRouter;