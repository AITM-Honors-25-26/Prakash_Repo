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

const dhInit = async()=>{
    try{
        await mongoose.connect(DBConfig.mongodbUrl, {
            dbName:DBConfig.dbName,
            autoCreate: true,
            autoIndex:true
        })
        console.log("Sucessafully connected to mongose database...........................")

        await archiveOrdersForReleasedTables();
    }catch(exception){
        console.log("***************Error while connecting to mangoos database**********************");
        throw exception
    }
}

dhInit()
