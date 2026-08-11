import mongoose from "mongoose";

const DiscountRuleSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, "Discount code is required"],
        uppercase: true,
        trim: true
    },
    label: {
        type: String,
        trim: true,
        default: ""
    },
    type: {
        type: String,
        enum: ['PERCENTAGE', 'FLAT'],
        default: 'PERCENTAGE'
    },
    value: {
        type: Number,
        required: [true, "Discount value is required"],
        min: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const MembershipTierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Tier name is required"],
        trim: true
    },
    minVisits: {
        type: Number,
        required: [true, "Minimum visits is required"],
        min: 0
    },
    discountPercent: {
        type: Number,
        required: [true, "Discount percentage is required"],
        min: 0,
        max: 100
    },
    maxDiscountAmount: {
        type: Number,
        required: [true, "Maximum discount amount is required"],
        min: 0
    }
}, { timestamps: true });

const BillingSettingsSchema = new mongoose.Schema({
    taxRate: {
        type: Number,
        default: 13,
        min: 0,
        max: 100
    },
    serviceChargeRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    discounts: [DiscountRuleSchema],

    membershipEnabled: {
        type: Boolean,
        default: true
    },
    membershipTiers: [MembershipTierSchema],
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
}, { timestamps: true });

const BillingSettingsModel = mongoose.model("BillingSettings", BillingSettingsSchema);
export default BillingSettingsModel;
