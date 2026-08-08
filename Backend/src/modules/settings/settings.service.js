import BillingSettingsModel from "./settings.model.js";

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// Used when a fresh DB hasn't been configured yet, so the membership feature
// works out of the box. Admin can edit these from the Billing Settings screen.
const DEFAULT_MEMBERSHIP_TIERS = [
  { name: "Bronze", minVisits: 1, discountPercent: 5, maxDiscountAmount: 200 },
  { name: "Silver", minVisits: 5, discountPercent: 8, maxDiscountAmount: 400 },
  { name: "Gold", minVisits: 10, discountPercent: 12, maxDiscountAmount: 750 }
];

class SettingsService {

    // Lazily creates the singleton settings document the first time it's
    // requested, so a fresh DB doesn't need a manual seed step.
    getBillingSettings = async () => {
        try {
            let settings = await BillingSettingsModel.findOne({});
            if (!settings) {
                settings = await new BillingSettingsModel({
                    membershipTiers: DEFAULT_MEMBERSHIP_TIERS
                }).save();
            } else if (!Array.isArray(settings.membershipTiers) || settings.membershipTiers.length === 0) {
                // Upgrade path: existing DBs created before membership existed.
                settings.membershipTiers = DEFAULT_MEMBERSHIP_TIERS;
                await settings.save();
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
            if (data.membershipEnabled !== undefined) settings.membershipEnabled = data.membershipEnabled;
            if (Array.isArray(data.membershipTiers)) settings.membershipTiers = data.membershipTiers;
            if (adminId) settings.updatedBy = adminId;

            return await settings.save();
        } catch (exception) {
            throw exception;
        }
    }

    // Resolves the loyalty tier a member qualifies for based on how many times
    // they have ordered. Highest qualifying tier wins (tiers are sorted by
    // minVisits ascending). Returns null when they haven't reached any tier yet.
    getMembershipTier = (visitCount, settings) => {
        const tiers = (settings?.membershipTiers && settings.membershipTiers.length
            ? settings.membershipTiers
            : DEFAULT_MEMBERSHIP_TIERS);
        const visits = Math.max(Number(visitCount) || 0, 0);

        const qualifying = tiers
            .filter((tier) => visits >= (tier.minVisits || 0))
            .sort((a, b) => (b.minVisits || 0) - (a.minVisits || 0));

        return qualifying[0] || null;
    }

    // Central place where the bill is actually calculated so the same logic
    // runs for both the checkout "live preview" call and the real order
    // creation - the customer never computes their own tax/discount.
    // `member` is an optional resolved membership document ({ isVerified,
    // visitCount }) whose tier discount is layered on top of any promo code.
    calculateOrderTotals = async (subtotal, discountCode, member = null) => {
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

            // Loyalty / Membership discount - layered on top of the promo code,
            // but never lets the combined discount exceed the subtotal.
            let membershipDiscountAmount = 0;
            let membershipTier = null;

            if (member && member.isVerified && settings.membershipEnabled !== false) {
                const tier = this.getMembershipTier(member.visitCount, settings);
                if (tier) {
                    membershipTier = tier;
                    membershipDiscountAmount = (safeSubtotal * (tier.discountPercent || 0)) / 100;
                    membershipDiscountAmount = Math.min(
                        membershipDiscountAmount,
                        tier.maxDiscountAmount || 0,
                        safeSubtotal
                    );
                }
            }

            const totalDiscount = discountAmount + membershipDiscountAmount;
            const taxRate = settings.taxRate || 0;
            const serviceChargeRate = settings.serviceChargeRate || 0;

            const taxableAmount = safeSubtotal - totalDiscount;
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
                membershipTier: membershipTier ? membershipTier.name : null,
                membershipDiscountPercent: membershipTier ? membershipTier.discountPercent : 0,
                membershipDiscountAmount: round2(membershipDiscountAmount),
                membershipApplied: membershipDiscountAmount > 0,
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
