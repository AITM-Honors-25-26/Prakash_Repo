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

    // Fetches every table enriched with a live billing snapshot taken from its
    // active orders. Used by GET /table/list so the staff floor plan can show
    // "Paid" / "Unpaid Rs. X" on each table card. All active orders are pulled
    // once and grouped in memory to avoid an N+1 query pattern.
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

                // A released / unavailable table should never show stale active
                // orders or an outstanding bill - historical (already paid)
                // orders belong to the previous sitting.
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

    // Reception / Payments Console - full billing picture for every table:
    // each table with its orders (itemized), the per-order bill breakdown, and
    // a room-wide summary so reception can settle bills and spot trouble.
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

            // Today's settled revenue. Counted across ALL paid orders (including
            // ones archived from already-released tables), so the console total
            // never shrinks just because a sitting finished.
            const paidTodayRows = await Order.aggregate([
                { $match: { paymentStatus: PaymentStatus.PAID, paidAt: { $gte: todayStart } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]);
            const totalPaidToday = paidTodayRows.length > 0 ? paidTodayRows[0].total : 0;

            let totalOutstanding = 0;
            let occupiedTables = 0;
            let paidTables = 0;

            // The console is only about active sittings - a released table drops
            // out entirely (its orders were archived when it was released), so it
            // can no longer linger in the billing tab for the next customer.
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

    // Reduces a list of a table's orders down to a single billing snapshot.
    // outstandingAmount = sum of every order that hasn't been paid yet, so the
    // table is only "Paid" once zero amount is outstanding. A failed eSewa
    // attempt surfaces as "Failed" so staff can see a payment went wrong.
    computeBillingFromOrders = (orders) => {
        const unpaidOrders = orders.filter((o) => o.paymentStatus !== PaymentStatus.PAID);
        const outstandingAmount = unpaidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        let paymentStatus = PaymentStatus.PAID;
        if (orders.length === 0) {
            paymentStatus = PaymentStatus.UNPAID; // freshly occupied, no bill yet
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

    // Live billing snapshot for a single table (active = anything not
    // Cancelled; served-but-unpaid orders still count toward the bill).
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

    // Persists the table's billing snapshot. Called whenever an order is
    // created / edited / cancelled / deleted / paid so the table card on the
    // staff floor plan always matches reality.
    refreshTableBilling = async (tableNumber) => {
        try {
            const current = await Table.findOne({ tableNumber: Number(tableNumber) });
            if (!current) return null;

            // A free table never carries a bill - the sitting has ended, so any
            // stray refresh must not resurrect stale amounts from past sittings.
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
                    // Fresh sitting => no bill outstanding yet.
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
            // A table may only be freed once the whole bill is settled, so a
            // waiter can't accidentally clear an unpaid table.
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
                // The sitting is over - archive this table's orders so the next
                // customer starts with a completely clean bill and the paid ones
                // stop lingering in the Reception payments console.
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

    // Staff (Waiter/Admin/Reception) flow - marks every unpaid active order at
    // this table as Paid (counter payment) and refreshes the table's billing
    // snapshot so it can then be released.
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
                    // Settled at the counter, so the recorded method is Counter
                    // regardless of how the customer first tried to pay.
                    order.paymentMethod = 'Counter';
                    order.paidAt = new Date();
                    await order.save();

                    // Credit the member's lifetime spend on first payment.
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

    // Staff (Waiter/Admin) flow - makes the table Available again, but only
    // once every active order has been paid. Returns { released: false,
    // billing } when there is still money outstanding so the controller can
    // respond with a helpful 409.
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
                // Sitting over - archive the table's orders so they vanish from
                // live billing and the next customer's bill starts clean.
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