import analyticsSvc from "./analytics.service.js";

class AnalyticsController {

    getOverview = async (req, res, next) => {
        try {
            const data = await analyticsSvc.getOverview();
            res.json({
                data,
                message: "Analytics overview fetched successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    getSalesTrend = async (req, res, next) => {
        try {
            const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
            const data = await analyticsSvc.getSalesTrend(days);
            res.json({
                data,
                message: "Sales trend fetched successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    getTopItems = async (req, res, next) => {
        try {
            const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
            const data = await analyticsSvc.getTopItems(limit);
            res.json({
                data,
                message: "Top selling items fetched successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }
}

const analyticsCtrl = new AnalyticsController();
export default analyticsCtrl;
