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

    // QR codes encode the human-facing tableNumber, not the Mongo _id,
    // so table lookups coming from a scanned QR must go through this.
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

            // Since Tables don't have images in our schema, we can skip the Cloudinary deletion loop
            return await Table.findByIdAndDelete(id);
        } catch (exception) {
            throw exception;
        }
    }

    updateTableById = async (id, data) => {
        try {
            // FIXED: was referencing an undefined `TableModel` - now uses the imported `Table`
            const updated = await Table.findByIdAndUpdate(id, data, { new: true });
            if (!updated) {
                throw { status: 404, message: "Table not found" };
            }
            return updated;
        } catch (exception) {
            throw exception;
        }
    }

    // Atomic update by tableNumber, used by the QR occupy flow.
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

    // Single atomic operation: only flips Available -> Occupied if the table
    // is still Available at the moment the update runs. This closes the race
    // window that a separate "check status, then update" would leave open if
    // two guests scan the same table's QR code at the same time.
    occupyTableByNumber = async (tableNumber) => {
        try {
            return await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber), status: 'Available' },
                { status: 'Occupied' },
                { new: true }
            );
        } catch (exception) {
            throw exception;
        }
    }
}

const tableSvc = new TableService();
export default tableSvc;