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
    const occupyTable = async (req, res) => {
  try {
    const tableId = req.params.id;
    
    // 1. Find the table
    const table = await TableModel.findById(tableId); // Assuming Mongoose
    
    if (!table) {
      return res.status(404).json({ error: "Table not found." });
    }

    // 2. Check if it's already occupied
    if (table.status === 'occupied') {
      return res.status(409).json({ error: "This table is already in use." });
    }

    // 3. Update status to occupied
    table.status = 'occupied';
    await table.save();

    return res.status(200).json({ message: "Table successfully occupied." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while occupying table." });
  }
};

// Don't forget to export it!
    
}

const tableCtrl = new TableController();
export default tableCtrl;