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
        const updated = await TableModel.findByIdAndUpdate(id, data, { new: true });
        if (!updated) {
            throw { status: 404, message: "Table not found" };
        }
        return updated;
    } catch (error) {
        throw error;
    }
}
}

const tableSvc = new TableService();
export default tableSvc;