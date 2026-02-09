import mongoose from "mongoose";
import { Gender, UserRole } from "../../config/constants.js";

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        minLength: [2, "Name must be at least 2 characters"],
        maxLength: [50, "Name cannot exceed 50 characters"]
    },
    dob: {
        type: Date,
        required: [true, "Date of birth is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true, 
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is mandatory"],
        select: false 
    },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.WAITER 
    },
    gender: {
        type: String,
        enum: Object.values(Gender),
        required: [true, "Gender is required"]
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"]
    },
    address: {
        type: String,
        trim: true
    },
    image: {
        type: String, 
        default: null
    },
    isActivated: {
        type: Boolean,
        default: false 
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true, 
    autoCreate: true,
    autoIndex: true
});

// Create the model
const UserModel = mongoose.model("User", UserSchema);

export default UserModel;