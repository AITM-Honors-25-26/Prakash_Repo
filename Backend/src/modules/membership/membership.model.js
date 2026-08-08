import mongoose from "mongoose";

// Loyalty / Membership - a diner who has verified their phone or email via a
// one-time OTP. The more orders they place (visitCount), the higher the tier
// they qualify for and the bigger the automatic discount they get at checkout
// (see settings.service.js membershipTiers for the tier table).
const MembershipSchema = new mongoose.Schema({
    fullName: {
        type: String,
        trim: true,
        default: ""
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

    // OTP verification - hashed 6-digit code with a short expiry. Cleared as
    // soon as verification succeeds.
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

    // Loyalty bookkeeping - visitCount increments when a member places an
    // order; totalSpent accumulates only when an order is actually paid.
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
