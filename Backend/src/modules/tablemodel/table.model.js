import mongoose from "mongoose";

const TableSchema = new mongoose.Schema({
    tableNumber: { 
        type: Number, 
        required: true,
        unique: true 
    },
    capacity: { 
        type: Number, 
        required: true,
        min: 1 
    },
    status: { 
        type: String, 
        enum: ['Available', 'Occupied', 'Reserved','NotAvailable'], 
        default: 'Available' 
    },
    location: {
        type: String,
        enum: ['Indoor', 'Outdoor', 'Window', 'Balcony'],
        default: 'Indoor'
    }
}, { timestamps: true });

export const Table = mongoose.model("Table", TableSchema);