import { Table } from "../tablemodel/table.model.js";

class TableService {
    transformTableData = async (req) => {
        try {
            let data = { ...req.body };

            // Convert string inputs to Numbers to match our Table schema
            if (data.tableNumber) data.tableNumber = Number(data.tableNumber);
            if (data.capacity) data.capacity = Number(data.capacity);

            return data;
        } catch (exception) {
            throw exception;
        }
    }

    storeTable = async (data) => {
        try {
            const tableObj = new Table(data);
            return await tableObj.save();
        } catch (exception) {
            throw exception;
        }
    }

    getAllTables = async (filter = {}) => {
        try {
            return await Table.find(filter);
        } catch (exception) {
            throw exception;
        }
    }

    getTableById = async (id) => {
        try {
            return await Table.findById(id);
        } catch (exception) {
            throw exception;
        }
    }
    getTableByNumber = async (tableNumber) => {
        try {
            return await Table.findOne({ tableNumber: Number(tableNumber) });
        } catch (exception) {
            throw exception;
        }
    }

    deleteTableById = async (id) => {
        try {
            const table = await Table.findById(id);
            if (!table) {
                throw { status: 404, message: "Table not found." };
            }
            return await Table.findByIdAndDelete(id);
        } catch (exception) {
            throw exception;
        }
    }

    updateTableById = async (id, data) => {
        try {
            const updated = await Table.findByIdAndUpdate(id, data, { new: true });
            if (!updated) {
                throw { status: 404, message: "Table not found" };
            }
            return updated;
        } catch (exception) {
            throw exception;
        }
    }

    updateTableByNumber = async (tableNumber, data) => {
        try {
            const updated = await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber) },
                data,
                { new: true }
            );
            if (!updated) {
                throw { status: 404, message: "Table not found" };
            }
            return updated;
        } catch (exception) {
            throw exception;
        }
    }
    occupyTableByNumber = async (tableNumber, sessionId) => {
        try {
            const occupied = await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber), status: 'Available' },
                { status: 'Occupied', occupiedBy: sessionId || null },
                { new: true }
            );

            if (occupied) {
                return occupied;
            }

            // Not Available anymore - only succeed if it's already ours.
            if (sessionId) {
                const ownTable = await Table.findOne({
                    tableNumber: Number(tableNumber),
                    status: 'Occupied',
                    occupiedBy: sessionId
                });

                if (ownTable) {
                    return ownTable;
                }
            }

            return null;
        } catch (exception) {
            throw exception;
        }
    }

    // Frees a table back to Available, but only if the caller's sessionId is
    // the one that currently holds it (or no sessionId is enforced by the
    // caller, e.g. an admin override done elsewhere via updateTableByNumber).
    releaseTableByNumber = async (tableNumber, sessionId) => {
        try {
            return await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber), status: 'Occupied', occupiedBy: sessionId },
                { status: 'Available', occupiedBy: null },
                { new: true }
            );
        } catch (exception) {
            throw exception;
        }
    }
}

const tableSvc = new TableService();
export default tableSvc;