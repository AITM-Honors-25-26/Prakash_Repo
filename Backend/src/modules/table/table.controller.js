import tableSvc from "./table.service.js";

class TableController {
    createTable = async (req, res, next) => {
        try {
            const data = await tableSvc.transformTableData(req);
            const savedTable = await tableSvc.storeTable(data);
            
            res.status(201).json({
                result: savedTable,
                message: "Table added successfully!",
                meta: null
            });
        } catch (exception) {
            next(exception); 
        }
    }

    getAllTables = async (req, res, next) => {
        try {
            const list = await tableSvc.getAllTables({});
            
            res.json({
                result: list,
                message: "Tables fetched successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    deleteTable = async (req, res, next) => {
        try {
            const id = req.params.id;
            const deletedResponse = await tableSvc.deleteTableById(id);
            
            res.json({
                result: deletedResponse,
                message: "Table deleted successfully.",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    updateTable = async (req, res, next) => {
        try {
            const id = req.params.id;
            const data = req.body; 

            const updatedTable = await tableSvc.updateTableById(id, data);
            
            res.json({
                result: updatedTable, 
                message: "Table updated successfully.",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    // FIXED: Removed 'const', added 'next', and utilized 'tableSvc'
    occupyTable = async (req, res, next) => {
        try {
            const tableId = req.params.id;
            
            // 1. Find the table using your service layer
            const table = await tableSvc.getTableById(tableId); 
            
            if (!table) {
                // Changed to match your standard JSON response format
                return res.status(404).json({ 
                    result: null, 
                    message: "Table not found.", 
                    meta: null 
                });
            }

            // 2. Check if it's already occupied
            if (table.status === 'occupied') {
                return res.status(409).json({ 
                    result: null, 
                    message: "This table is already in use.", 
                    meta: null 
                });
            }
            const updatedTable = await tableSvc.updateTableById(tableId, { status: 'occupied' });

            return res.status(200).json({ 
                result: updatedTable, 
                message: "Table successfully occupied.", 
                meta: null 
            });
        } catch (exception) {
            // Passed to your centralized error handler
            next(exception);
        }
    }
}

const tableCtrl = new TableController();
export default tableCtrl;