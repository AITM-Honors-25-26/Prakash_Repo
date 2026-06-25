import mongoose from "mongoose";
import { DBConfig } from "./constants.js";

const dhInit = async()=>{
    try{
        await mongoose.connect(DBConfig.mongodbUrl, {
            dbName:DBConfig.dbName,
            autoCreate: true,
            autoIndex:true
        })
        console.log("Sucessafully connected to mongose database...........................")

    }catch(exception){
        console.log("***************Error while connecting to mangoos database**********************");
        throw exception
    }
}

dhInit()