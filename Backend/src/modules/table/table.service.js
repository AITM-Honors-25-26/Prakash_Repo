import { Table } from "../tablemodel/table.model.js";
import Order from "../ordermodel/order.model.js";
import { OrderStatus, PaymentStatus, TableStatus } from "../../config/constants.js";
import membershipSvc from "../membership/membership.service.js";

class TableService {
    transformTableData = async (req) => {
        try {
            let data = { ...req.body };

            if (data.tableNumber) data.tableNumber = Number(data.tableNumber);
            if (data.capacity) data.capacity = Number(data.capacity);

            return data;
        } catch (exception) {
            throw exception;
        }
    }

    storeTable = async (data) => {
        try {
            const tableObj = new Table(data);
            return await tableObj.save();
        } catch (exception) {
            throw exception;
        }
    }

    getAllTables = async (filter = {}) => {
        try {
            return await Table.find(filter);
        } catch (exception) {
            throw exception;
        }
    }

    getAllTablesWithBilling = async (filter = {}) => {
        try {
            const tables = await Table.find(filter).sort({ tableNumber: 1 });

            const orders = await Order.find({
                status: { $nin: [OrderStatus.CANCELLED] },
                isCleared: false
            });

            const ordersByTable = new Map();
            orders.forEach((order) => {
                const key = String(order.tableNumber);
                if (!ordersByTable.has(key)) ordersByTable.set(key, []);
                ordersByTable.get(key).push(order);
            });

            return tables.map((table) => {
                const tableOrders = ordersByTable.get(String(table.tableNumber)) || [];
                const isOccupied = table.status === TableStatus.OCCUPIED || table.status === TableStatus.RESERVED;

                const billing = isOccupied
                    ? this.computeBillingFromOrders(tableOrders)
                    : { paymentStatus: PaymentStatus.PAID, outstandingAmount: 0, activeOrdersCount: 0 };

                return {
                    ...table.toObject(),
                    paymentStatus: billing.paymentStatus,
                    outstandingAmount: billing.outstandingAmount,
                    activeOrdersCount: billing.activeOrdersCount
                };
            });
        } catch (exception) {
            throw exception;
        }
    }

    getPaymentsOverview = async () => {
        try {
            const tables = await Table.find({}).sort({ tableNumber: 1 });
            const orders = await Order.find({
                status: { $nin: [OrderStatus.CANCELLED] },
                isCleared: false
            }).sort({ createdAt: 1 });

            const ordersByTable = new Map();
            orders.forEach((order) => {
                const key = String(order.tableNumber);
                if (!ordersByTable.has(key)) ordersByTable.set(key, []);
                ordersByTable.get(key).push(order);
            });

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const paidTodayRows = await Order.aggregate([
                { $match: { paymentStatus: PaymentStatus.PAID, paidAt: { $gte: todayStart } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]);
            const totalPaidToday = paidTodayRows.length > 0 ? paidTodayRows[0].total : 0;

            let totalOutstanding = 0;
            let occupiedTables = 0;
            let paidTables = 0;

            const activeTables = tables.filter(
                (table) => table.status === TableStatus.OCCUPIED || table.status === TableStatus.RESERVED
            );

            const tableRows = activeTables.map((table) => {
                const tableOrders = ordersByTable.get(String(table.tableNumber)) || [];
                const billing = this.computeBillingFromOrders(tableOrders);

                occupiedTables += 1;
                totalOutstanding += billing.outstandingAmount;
                if (billing.paymentStatus === PaymentStatus.PAID) paidTables += 1;

                return {
                    tableNumber: table.tableNumber,
                    status: table.status,
                    location: table.location,
                    occupiedBy: table.occupiedBy,
                    billing,
                    orders: tableOrders.map((order) => ({
                        _id: order._id,
                        status: order.status,
                        paymentStatus: order.paymentStatus,
                        paymentMethod: order.paymentMethod,
                        items: order.items,
                        subtotal: order.subtotal,
                        discountCode: order.discountCode,
                        discountAmount: order.discountAmount,
                        membershipTier: order.membershipTier,
                        membershipDiscountPercent: order.membershipDiscountPercent,
                        membershipDiscountAmount: order.membershipDiscountAmount,
                        taxRate: order.taxRate,
                        taxAmount: order.taxAmount,
                        serviceChargeRate: order.serviceChargeRate,
                        serviceChargeAmount: order.serviceChargeAmount,
                        totalPrice: order.totalPrice,
                        paidAt: order.paidAt,
                        createdAt: order.createdAt
                    }))
                };
            });

            return {
                summary: {
                    totalOutstanding,
                    totalPaidToday,
                    occupiedTables,
                    paidTables,
                    unpaidTables: occupiedTables - paidTables
                },
                tables: tableRows
            };
        } catch (exception) {
            throw exception;
        }
    }

    computeBillingFromOrders = (orders) => {
        const unpaidOrders = orders.filter((o) => o.paymentStatus !== PaymentStatus.PAID);
        const outstandingAmount = unpaidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        let paymentStatus = PaymentStatus.PAID;
        if (orders.length === 0) {
            paymentStatus = PaymentStatus.UNPAID;
        } else if (outstandingAmount > 0) {
            const hasFailed = unpaidOrders.some((o) => o.paymentStatus === PaymentStatus.FAILED);
            const hasPending = unpaidOrders.some((o) => o.paymentStatus === PaymentStatus.PENDING);
            paymentStatus = hasFailed ? PaymentStatus.FAILED : (hasPending ? PaymentStatus.PENDING : PaymentStatus.UNPAID);
        }

        return {
            paymentStatus,
            outstandingAmount,
            activeOrdersCount: orders.length
        };
    }

    getTableBilling = async (tableNumber) => {
        try {
            const orders = await Order.find({
                tableNumber: String(tableNumber),
                status: { $nin: [OrderStatus.CANCELLED] },
                isCleared: false
            });

            return {
                ...this.computeBillingFromOrders(orders),
                orders
            };
        } catch (exception) {
            throw exception;
        }
    }

    refreshTableBilling = async (tableNumber) => {
        try {
            const current = await Table.findOne({ tableNumber: Number(tableNumber) });
            if (!current) return null;

            if (current.status !== TableStatus.OCCUPIED && current.status !== TableStatus.RESERVED) {
                return await Table.findOneAndUpdate(
                    { tableNumber: Number(tableNumber) },
                    {
                        paymentStatus: PaymentStatus.PAID,
                        outstandingAmount: 0,
                        activeOrdersCount: 0
                    },
                    { new: true }
                );
            }

            const billing = await this.getTableBilling(tableNumber);

            return await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber) },
                {
                    paymentStatus: billing.paymentStatus,
                    outstandingAmount: billing.outstandingAmount,
                    activeOrdersCount: billing.activeOrdersCount
                },
                { new: true }
            );
        } catch (exception) {
            throw exception;
        }
    }

    getTableById = async (id) => {
        try {
            return await Table.findById(id);
        } catch (exception) {
            throw exception;
        }
    }
    getTableByNumber = async (tableNumber) => {
        try {
            return await Table.findOne({ tableNumber: Number(tableNumber) });
        } catch (exception) {
            throw exception;
        }
    }

    deleteTableById = async (id) => {
        try {
            const table = await Table.findById(id);
            if (!table) {
                throw { status: 404, message: "Table not found." };
            }
            return await Table.findByIdAndDelete(id);
        } catch (exception) {
            throw exception;
        }
    }

    updateTableById = async (id, data) => {
        try {
            const updated = await Table.findByIdAndUpdate(id, data, { new: true });
            if (!updated) {
                throw { status: 404, message: "Table not found" };
            }
            return updated;
        } catch (exception) {
            throw exception;
        }
    }

    updateTableByNumber = async (tableNumber, data) => {
        try {
            const updated = await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber) },
                data,
                { new: true }
            );
            if (!updated) {
                throw { status: 404, message: "Table not found" };
            }
            return updated;
        } catch (exception) {
            throw exception;
        }
    }
    occupyTableByNumber = async (tableNumber, sessionId) => {
        try {
            const occupied = await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber), status: 'Available' },
                {
                    status: 'Occupied',
                    occupiedBy: sessionId || null,
                    paymentStatus: PaymentStatus.UNPAID,
                    outstandingAmount: 0,
                    activeOrdersCount: 0
                },
                { new: true }
            );

            if (occupied) {
                return occupied;
            }

            if (sessionId) {
                const ownTable = await Table.findOne({
                    tableNumber: Number(tableNumber),
                    status: 'Occupied',
                    occupiedBy: sessionId
                });

                if (ownTable) {
                    return ownTable;
                }
            }

            return null;
        } catch (exception) {
            throw exception;
        }
    }
    releaseTableByNumber = async (tableNumber, sessionId) => {
        try {
            const billing = await this.getTableBilling(tableNumber);
            if (billing.outstandingAmount > 0) {
                throw {
                    code: 409,
                    message: `This table still has Rs. ${billing.outstandingAmount} outstanding. Please settle the bill before releasing the table.`
                };
            }

            const released = await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber), status: 'Occupied', occupiedBy: sessionId },
                {
                    status: 'Available',
                    occupiedBy: null,
                    paymentStatus: PaymentStatus.PAID,
                    outstandingAmount: 0,
                    activeOrdersCount: 0
                },
                { new: true }
            );

            if (released) {
                await Order.updateMany(
                    {
                        tableNumber: String(tableNumber),
                        status: { $nin: [OrderStatus.CANCELLED] }
                    },
                    { $set: { isCleared: true } }
                );
            }

            return released;
        } catch (exception) {
            throw exception;
        }
    }

    settleTableByNumber = async (tableNumber) => {
        try {
            const table = await Table.findOne({ tableNumber: Number(tableNumber) });
            if (!table) {
                throw { code: 404, message: "Table not found." };
            }

            const orders = await Order.find({
                tableNumber: String(tableNumber),
                status: { $nin: [OrderStatus.CANCELLED] },
                isCleared: false
            });

            await Promise.all(orders.map(async (order) => {
                if (order.paymentStatus !== PaymentStatus.PAID) {
                    order.paymentStatus = PaymentStatus.PAID;
                    order.paymentMethod = 'Counter';
                    order.paidAt = new Date();
                    await order.save();

                    if (order.membershipId) {
                        await membershipSvc.recordPayment(order.membershipId, order.totalPrice);
                    }
                }
            }));

            return await this.refreshTableBilling(tableNumber);
        } catch (exception) {
            throw exception;
        }
    }

    staffReleaseTableByNumber = async (tableNumber) => {
        try {
            const billing = await this.getTableBilling(tableNumber);
            if (billing.outstandingAmount > 0) {
                return {
                    released: false,
                    billing
                };
            }

            const released = await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber) },
                {
                    status: TableStatus.AVAILABLE,
                    occupiedBy: null,
                    paymentStatus: PaymentStatus.PAID,
                    outstandingAmount: 0,
                    activeOrdersCount: 0
                },
                { new: true }
            );

            if (released) {
                await Order.updateMany(
                    {
                        tableNumber: String(tableNumber),
                        status: { $nin: [OrderStatus.CANCELLED] }
                    },
                    { $set: { isCleared: true } }
                );
            }

            return {
                released: true,
                table: released
            };
        } catch (exception) {
            throw exception;
        }
    }
}

const tableSvc = new TableService();
export default tableSvc;
