import { Router } from "express";
import tableCtrl from "./table.controller.js";
import { tableCreateSchema } from "./table.validator.js";
import { bodyValidator } from "../../middleware/request.validator.js";
import allowUser from "../../middleware/auth.middelware.js";
import { UserRole } from "../../config/constants.js";

const tableRouter = Router();

tableRouter.post('/table/add',allowUser([UserRole.ADMIN]),bodyValidator(tableCreateSchema),tableCtrl.createTable);
tableRouter.get('/table/list',tableCtrl.getAllTables);
tableRouter.get('/table/payments', allowUser([UserRole.ADMIN, UserRole.WAITER, UserRole.RECEPTION]), tableCtrl.getPaymentsOverview);
tableRouter.delete('/table/:id',allowUser([UserRole.ADMIN]),tableCtrl.deleteTable);
tableRouter.put('/table/:id', allowUser([UserRole.ADMIN]), tableCtrl.updateTable);

tableRouter.put('/table/:id/occupy', tableCtrl.occupyTable);
tableRouter.put('/table/:id/release', tableCtrl.releaseTable);

tableRouter.put('/table/:id/settle', allowUser([UserRole.ADMIN, UserRole.WAITER, UserRole.RECEPTION]), tableCtrl.settleTable);
tableRouter.put('/table/:id/mark-available', allowUser([UserRole.ADMIN, UserRole.WAITER, UserRole.RECEPTION]), tableCtrl.markTableAvailable);

export default tableRouter;
