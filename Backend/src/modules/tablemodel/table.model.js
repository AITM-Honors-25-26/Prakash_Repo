// import mongoose from "mongoose";

// const TableSchema = new mongoose.Schema({
//     tableNumber: { 
//         type: Number, 
//         required: true,
//         unique: true 
//     },
//     capacity: { 
//         type: Number, 
//         required: true,
//         min: 1 
//     },
//     status: { 
//         type: String, 
//         enum: ['Available', 'Occupied', 'Reserved','NotAvailable'], 
//         default: 'Available' 
//     },
//     location: {
//         type: String,
//         enum: ['Indoor', 'Outdoor', 'Window', 'Balcony'],
//         default: 'Indoor'
//     }
// }, { timestamps: true });

// export const Table = mongoose.model("Table", TableSchema);



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
    },
    // Anonymous per-browser session id of whoever currently holds this table.
    // Lets us tell "same guest refreshing the page" apart from
    // "a different device scanning the same QR code".
    occupiedBy: {
        type: String,
        default: null
    }
}, { timestamps: true });

export const Table = mongoose.model("Table", TableSchema);