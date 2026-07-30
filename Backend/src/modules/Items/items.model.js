import mongoose from "mongoose";

const bakerySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        enum: ['Cake', 'Bread', 'Pastries', 'Cookies', 'Beverage','Cupcake','Donuts','Special'],
        required: true
    },
    images: [{
        url: String,
        public_id: String
    }],
    stock: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },

    // Order Customization: optional extras a customer can pick when adding
    // this item to their cart (e.g. "Extra Cheese" +Rs. 50). Kept as a simple
    // flat list rather than grouped variants to match the FYP's scope.
    addOns: [{
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 }
    }]
}, { timestamps: true });

export const Bakery = mongoose.model("Bakery", bakerySchema);