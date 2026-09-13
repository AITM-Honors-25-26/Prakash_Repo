import mongoose from "mongoose";
import { DBConfig, TableStatus } from "./constants.js";
import { Table } from "../modules/tablemodel/table.model.js";
import Order from "../modules/ordermodel/order.model.js";

const archiveOrdersForReleasedTables = async () => {
    try {
        const releasedTables = await Table.find({
            status: { $nin: [TableStatus.OCCUPIED, TableStatus.RESERVED] }
        }).select("tableNumber");
        const numbers = releasedTables.map((t) => String(t.tableNumber));
        if (numbers.length === 0) return;

        const result = await Order.updateMany(
            { tableNumber: { $in: numbers } },
            { $set: { isCleared: true } }
        );
        console.log(`Archived ${result.modifiedCount ?? 0} order(s) from released tables.`);
    } catch (exception) {
        console.error("Error while archiving orders from released tables:", exception.message);
    }
};

export const dbReady = (async () => {
    try{
        await mongoose.connect(DBConfig.mongodbUrl, {
            dbName:DBConfig.dbName,
            autoCreate: true,
            autoIndex:true
        })

        await archiveOrdersForReleasedTables();
    }catch(exception){
        console.error("Error while connecting to MongoDB database:", exception);
        throw exception;
    }
})();
