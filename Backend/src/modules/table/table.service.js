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
    //
    // `sessionId` is an anonymous id the guest's browser generates and keeps
    // in localStorage. It lets us tell "the same guest reloading the page"
    // apart from "a different device scanning the same QR code":
    //   - Table is Available            -> occupy it, tag it with sessionId.
    //   - Table is Occupied by this SAME sessionId -> treat as a no-op
    //     success (this is just a refresh/remount, not a new guest).
    //   - Table is Occupied by a DIFFERENT sessionId -> real conflict, the
    //     caller should get a 409 so the frontend can show the error page.
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