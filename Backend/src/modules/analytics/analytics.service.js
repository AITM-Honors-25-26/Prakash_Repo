import Order from '../ordermodel/order.model.js';
import { OrderStatus, PaymentStatus } from '../../config/constants.js';

const startOfDay = (date) => {
    const clone = new Date(date);
    clone.setHours(0, 0, 0, 0);
    return clone;
};

const toDateKey = (date) => date.toISOString().slice(0, 10);

class AnalyticsService {

    getOverview = async () => {
        try {
            const now = new Date();
            const todayStart = startOfDay(now);
            const weekStart = new Date(todayStart);
            weekStart.setDate(weekStart.getDate() - 6);
            const monthStart = new Date(todayStart);
            monthStart.setDate(1);

            const revenueAgg = (matchExtra = {}) => Order.aggregate([
                { $match: { paymentStatus: PaymentStatus.PAID, ...matchExtra } },
                { $group: { _id: null, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } }
            ]);

            const [todayAgg, weekAgg, monthAgg, allTimeAgg, statusCounts, pendingKitchenOrders] = await Promise.all([
                revenueAgg({ createdAt: { $gte: todayStart } }),
                revenueAgg({ createdAt: { $gte: weekStart } }),
                revenueAgg({ createdAt: { $gte: monthStart } }),
                revenueAgg(),
                Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
                Order.countDocuments({ status: { $in: [OrderStatus.PENDING, OrderStatus.PREPARING] } })
            ]);

            const pick = (agg) => agg[0] || { revenue: 0, orders: 0 };
            const today = pick(todayAgg);
            const week = pick(weekAgg);
            const month = pick(monthAgg);
            const allTime = pick(allTimeAgg);

            const ordersByStatus = {};
            Object.values(OrderStatus).forEach((status) => { ordersByStatus[status] = 0; });
            statusCounts.forEach((row) => { ordersByStatus[row._id] = row.count; });

            return {
                todayRevenue: today.revenue,
                todayOrders: today.orders,
                weekRevenue: week.revenue,
                weekOrders: week.orders,
                monthRevenue: month.revenue,
                monthOrders: month.orders,
                totalRevenue: allTime.revenue,
                totalOrders: allTime.orders,
                avgOrderValue: allTime.orders ? Math.round((allTime.revenue / allTime.orders) * 100) / 100 : 0,
                pendingKitchenOrders,
                ordersByStatus
            };
        } catch (exception) {
            throw exception;
        }
    }

    getSalesTrend = async (days = 7) => {
        try {
            const from = startOfDay(new Date());
            from.setDate(from.getDate() - (days - 1));

            const rows = await Order.aggregate([
                { $match: { paymentStatus: PaymentStatus.PAID, createdAt: { $gte: from } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        revenue: { $sum: '$totalPrice' },
                        orders: { $sum: 1 }
                    }
                }
            ]);

            const rowsByDate = {};
            rows.forEach((row) => { rowsByDate[row._id] = row; });

            const series = [];
            for (let i = 0; i < days; i++) {
                const d = new Date(from);
                d.setDate(d.getDate() + i);
                const key = toDateKey(d);
                const row = rowsByDate[key];
                series.push({
                    date: key,
                    revenue: row ? row.revenue : 0,
                    orders: row ? row.orders : 0
                });
            }
            return series;
        } catch (exception) {
            throw exception;
        }
    }

    getTopItems = async (limit = 5) => {
        try {
            const rows = await Order.aggregate([
                { $match: { paymentStatus: PaymentStatus.PAID } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.name',
                        quantitySold: { $sum: '$items.quantity' },
                        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                    }
                },
                { $sort: { quantitySold: -1 } },
                { $limit: limit }
            ]);

            return rows.map((row) => ({
                name: row._id,
                quantitySold: row.quantitySold,
                revenue: row.revenue
            }));
        } catch (exception) {
            throw exception;
        }
    }
}

const analyticsSvc = new AnalyticsService();
export default analyticsSvc;
