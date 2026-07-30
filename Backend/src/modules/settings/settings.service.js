import BillingSettingsModel from "./settings.model.js";

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

class SettingsService {

    // Lazily creates the singleton settings document the first time it's
    // requested, so a fresh DB doesn't need a manual seed step.
    getBillingSettings = async () => {
        try {
            let settings = await BillingSettingsModel.findOne({});
            if (!settings) {
                settings = await new BillingSettingsModel({}).save();
            }
            return settings;
        } catch (exception) {
            throw exception;
        }
    }

    updateBillingSettings = async (data, adminId) => {
        try {
            const settings = await this.getBillingSettings();

            if (data.taxRate !== undefined) settings.taxRate = data.taxRate;
            if (data.serviceChargeRate !== undefined) settings.serviceChargeRate = data.serviceChargeRate;
            if (Array.isArray(data.discounts)) settings.discounts = data.discounts;
            if (adminId) settings.updatedBy = adminId;

            return await settings.save();
        } catch (exception) {
            throw exception;
        }
    }

    // Central place where the bill is actually calculated so the same logic
    // runs for both the checkout "live preview" call and the real order
    // creation - the customer never computes their own tax/discount.
    calculateOrderTotals = async (subtotal, discountCode) => {
        try {
            const settings = await this.getBillingSettings();
            const safeSubtotal = Math.max(Number(subtotal) || 0, 0);

            let discountAmount = 0;
            let appliedDiscountCode = null;

            if (discountCode) {
                const normalizedCode = String(discountCode).toUpperCase().trim();
                const rule = (settings.discounts || []).find((discount) =>
                    discount.code === normalizedCode &&
                    discount.isActive &&
                    (!discount.expiresAt || new Date(discount.expiresAt) > new Date()) &&
                    safeSubtotal >= (discount.minOrderAmount || 0)
                );

                if (rule) {
                    discountAmount = rule.type === 'PERCENTAGE'
                        ? (safeSubtotal * rule.value) / 100
                        : rule.value;
                    discountAmount = Math.min(discountAmount, safeSubtotal);
                    appliedDiscountCode = rule.code;
                }
            }

            const taxRate = settings.taxRate || 0;
            const serviceChargeRate = settings.serviceChargeRate || 0;

            const taxableAmount = safeSubtotal - discountAmount;
            const taxAmount = (taxableAmount * taxRate) / 100;
            const serviceChargeAmount = (safeSubtotal * serviceChargeRate) / 100;
            const totalPrice = taxableAmount + taxAmount + serviceChargeAmount;

            return {
                subtotal: round2(safeSubtotal),
                discountCode: appliedDiscountCode,
                discountAmount: round2(discountAmount),
                discountApplied: Boolean(appliedDiscountCode),
                discountRejectedReason: discountCode && !appliedDiscountCode
                    ? "Discount code is invalid, inactive, expired, or the order does not meet the minimum amount."
                    : null,
                taxRate,
                taxAmount: round2(taxAmount),
                serviceChargeRate,
                serviceChargeAmount: round2(serviceChargeAmount),
                totalPrice: round2(totalPrice)
            };
        } catch (exception) {
            throw exception;
        }
    }
}

const settingsSvc = new SettingsService();
export default settingsSvc;
