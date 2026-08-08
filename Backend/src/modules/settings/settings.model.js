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

// Loyalty tier - a member who has visited at least minVisits times gets a
// discountPercent discount on their bill, capped at maxDiscountAmount per
// order (the "limit" from the requirement). Tiers are ordered by minVisits.
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

// Single source of truth for restaurant-wide tax, service charge, and promo
// codes. We intentionally keep this as a singleton document (findOne / lazily
// created) rather than a per-item setting, since the requirement is a global
// configurable rate the Admin can tune from the Billing Settings screen.
const BillingSettingsSchema = new mongoose.Schema({
    taxRate: {
        type: Number,
        default: 13, // Nepal VAT default, editable by Admin
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

    // Loyalty / Membership program switch + tier table. When enabled, a
    // verified member who types their phone/email at checkout gets their
    // tier discount applied automatically.
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
