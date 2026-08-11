import mongoose from "mongoose";

const MembershipSchema = new mongoose.Schema({
    fullName: {
        type: String,
        trim: true,
        default: ""
    },

    dob: {
        type: String,
        trim: true,
        default: null
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        default: null
    },
    address: {
        type: String,
        trim: true,
        default: null
    },
    phone: {
        type: String,
        trim: true,
        default: null,
        index: true,
        sparse: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        default: null,
        index: true,
        sparse: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },

    otpHash: {
        type: String,
        default: null
    },
    otpExpiresAt: {
        type: Date,
        default: null
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    lastOtpSentAt: {
        type: Date,
        default: null
    },

    visitCount: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const MembershipModel = mongoose.model("Membership", MembershipSchema);
export default MembershipModel;
