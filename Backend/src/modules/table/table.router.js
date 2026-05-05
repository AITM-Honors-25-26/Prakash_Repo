import { Router } from "express";
import tableCtrl from "./table.controller.js";
import { tableCreateSchema } from "./table.validator.js"; 
import { bodyValidator } from "../../middleware/request.validator.js";
import allowUser from "../../middleware/auth.middelware.js";
import { UserRole } from "../../config/constants.js";

const tableRouter = Router();

// Add a new table
tableRouter.post(
    '/table/add', 
    allowUser([UserRole.ADMIN]), 
    bodyValidator(tableCreateSchema), 
    tableCtrl.createTable
);

// Get a list of all tables
tableRouter.get(
    '/table/list', 
    tableCtrl.getAllTables
);

// Delete a specific table by ID
tableRouter.delete(
    '/table/:id', 
    allowUser([UserRole.ADMIN]), 
    tableCtrl.deleteTable
);

export default tableRouter;