import settingsSvc from "./settings.service.js";

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
    previewTotals = async (req, res, next) => {
        try {
            const { subtotal, discountCode } = req.body;

            if (typeof subtotal !== 'number' || subtotal < 0) {
                return next({
                    code: 400,
                    message: "A valid subtotal amount is required",
                    status: "VALIDATION_FAILED"
                });
            }

            const totals = await settingsSvc.calculateOrderTotals(subtotal, discountCode);
            res.json({
                data: totals,
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
