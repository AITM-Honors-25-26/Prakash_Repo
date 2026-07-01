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

    // FIXED:
    //  - QR codes encode the table's `tableNumber`, not its Mongo `_id`,
    //    so the lookup/update now goes through the *Number service methods.
    //  - Status values are capitalized in the schema ('Available' / 'Occupied'),
    //    so comparisons now match that casing.
    //  - occupyTableByNumber performs the Available -> Occupied flip as a single
    //    atomic findOneAndUpdate, so two guests scanning the same table's QR
    //    at the same moment can't both succeed. If it returns null we only
    //    then look the table up separately to report 404 vs 409 correctly.
    occupyTable = async (req, res, next) => {
        try {
            const tableNumber = req.params.id;

            const occupiedTable = await tableSvc.occupyTableByNumber(tableNumber);

            if (occupiedTable) {
                return res.status(200).json({
                    result: occupiedTable,
                    message: "Table successfully occupied.",
                    meta: null
                });
            }

            // Atomic update didn't match - find out why, purely for the error message.
            const existingTable = await tableSvc.getTableByNumber(tableNumber);

            if (!existingTable) {
                return res.status(404).json({
                    result: null,
                    message: "Table not found.",
                    meta: null
                });
            }

            return res.status(409).json({
                result: null,
                message: "This table is already in use.",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }
}

const tableCtrl = new TableController();
export default tableCtrl;