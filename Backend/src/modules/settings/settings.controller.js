import settingsSvc from "./settings.service.js";
import membershipSvc from "../membership/membership.service.js";

class SettingsController {

    // Public - the checkout page (unauthenticated customer) needs the current
    // tax/service-charge rate to render a live bill preview.
    getBillingSettings = async (req, res, next) => {
        try {
            const settings = await settingsSvc.getBillingSettings();
            res.json({
                data: settings,
                message: "Billing settings fetched successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    updateBillingSettings = async (req, res, next) => {
        try {
            const settings = await settingsSvc.updateBillingSettings(req.body, req.authUser?._id);
            res.json({
                data: settings,
                message: "Billing settings updated successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    // Public - lets the checkout page show subtotal/tax/discount/total before
    // the order is actually created, using the same math the server will use.
    // A verified member's phone/email can be supplied so their tier discount
    // is included in the live preview.
    previewTotals = async (req, res, next) => {
        try {
            const { subtotal, discountCode, membershipPhone, membershipEmail } = req.body;

            if (typeof subtotal !== 'number' || subtotal < 0) {
                return next({
                    code: 400,
                    message: "A valid subtotal amount is required",
                    status: "VALIDATION_FAILED"
                });
            }

            const member = (membershipPhone || membershipEmail)
                ? await membershipSvc.lookupVerifiedMember({
                    phone: membershipPhone,
                    email: membershipEmail
                })
                : null;

            const totals = await settingsSvc.calculateOrderTotals(subtotal, discountCode, member);
            res.json({
                data: {
                    ...totals,
                    member: member ? membershipSvc.getMemberProfile(member) : null
                },
                message: "Totals calculated successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }
}

const settingsCtrl = new SettingsController();
export default settingsCtrl;
