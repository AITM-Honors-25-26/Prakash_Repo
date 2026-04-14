import mongoose from "mongoose";

const bakerySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { 
        type: String, 
        enum: ['Cake', 'Bread', 'Pastry', 'Cookie'], 
        required: true 
    },
    images: [{ 
        url: String, 
        public_id: String // For Cloudinary management
    }],
    stock: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

export const Bakery = mongoose.model("Bakery", bakerySchema);