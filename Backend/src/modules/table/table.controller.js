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
            const list = await tableSvc.getAllTablesWithBilling({});

            res.json({
                result: list,
                message: "Tables fetched successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    getPaymentsOverview = async (req, res, next) => {
        try {
            const overview = await tableSvc.getPaymentsOverview();

            res.json({
                data: overview,
                message: "Payments overview fetched successfully",
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

    occupyTable = async (req, res, next) => {
        try {
            const tableNumber = req.params.id;
            const sessionId = req.body?.sessionId;

            const occupiedTable = await tableSvc.occupyTableByNumber(tableNumber, sessionId);

            if (occupiedTable) {
                return res.status(200).json({
                    result: occupiedTable,
                    message: "Table successfully occupied.",
                    meta: null
                });
            }

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

    releaseTable = async (req, res, next) => {
        try {
            const tableNumber = req.params.id;
            const sessionId = req.body?.sessionId;

            const releasedTable = await tableSvc.releaseTableByNumber(tableNumber, sessionId);

            if (!releasedTable) {
                return res.status(409).json({
                    result: null,
                    message: "Unable to release this table.",
                    meta: null
                });
            }

            return res.status(200).json({
                result: releasedTable,
                message: "Table released.",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    settleTable = async (req, res, next) => {
        try {
            const tableNumber = req.params.id;

            const settledTable = await tableSvc.settleTableByNumber(tableNumber);

            const io = req.app.get('io');
            if (io) io.emit('table_billing_updated', settledTable);

            return res.status(200).json({
                result: settledTable,
                message: "Bill settled. The table can now be released.",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    markTableAvailable = async (req, res, next) => {
        try {
            const tableNumber = req.params.id;

            const result = await tableSvc.staffReleaseTableByNumber(tableNumber);

            if (!result.released) {
                return res.status(409).json({
                    result: null,
                    message: `This table still has Rs. ${result.billing.outstandingAmount} outstanding. Please settle the bill first.`,
                    meta: { outstandingAmount: result.billing.outstandingAmount }
                });
            }

            const io = req.app.get('io');
            if (io) io.emit('table_billing_updated', result.table);

            return res.status(200).json({
                result: result.table,
                message: "Table is now available.",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }
}

const tableCtrl = new TableController();
export default tableCtrl;
