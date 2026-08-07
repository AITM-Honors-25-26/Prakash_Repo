import { Table } from "../tablemodel/table.model.js";
import Order from "../ordermodel/order.model.js";
import { OrderStatus, PaymentStatus, TableStatus } from "../../config/constants.js";

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
                status: { $nin: [OrderStatus.CANCELLED] }
            });

            const ordersByTable = new Map();
            orders.forEach((order) => {
                const key = String(order.tableNumber);
                if (!ordersByTable.has(key)) ordersByTable.set(key, []);
                ordersByTable.get(key).push(order);
            });

            return tables.map((table) => {
                const tableOrders = ordersByTable.get(String(table.tableNumber)) || [];
                const billing = this.computeBillingFromOrders(tableOrders);

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

    // Reduces a list of a table's orders down to a single billing snapshot.
    // outstandingAmount = sum of every order that hasn't been paid yet, so the
    // table is only "Paid" once zero amount is outstanding.
    computeBillingFromOrders = (orders) => {
        const unpaidOrders = orders.filter((o) => o.paymentStatus !== PaymentStatus.PAID);
        const outstandingAmount = unpaidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        let paymentStatus = PaymentStatus.PAID;
        if (outstandingAmount > 0) {
            paymentStatus = unpaidOrders.some((o) => o.paymentStatus === PaymentStatus.PENDING)
                ? PaymentStatus.PENDING
                : PaymentStatus.UNPAID;
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
                status: { $nin: [OrderStatus.CANCELLED] }
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
            const billing = await this.getTableBilling(tableNumber);

            const table = await Table.findOneAndUpdate(
                { tableNumber: Number(tableNumber) },
                {
                    paymentStatus: billing.paymentStatus,
                    outstandingAmount: billing.outstandingAmount,
                    activeOrdersCount: billing.activeOrdersCount
                },
                { new: true }
            );

            return table;
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

            return await Table.findOneAndUpdate(
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
        } catch (exception) {
            throw exception;
        }
    }

    // Staff (Waiter/Admin) flow - marks every unpaid active order at this
    // table as Paid (counter payment) and refreshes the table's billing
    // snapshot so it can then be released.
    settleTableByNumber = async (tableNumber) => {
        try {
            const table = await Table.findOne({ tableNumber: Number(tableNumber) });
            if (!table) {
                throw { code: 404, message: "Table not found." };
            }

            const orders = await Order.find({
                tableNumber: String(tableNumber),
                status: { $nin: [OrderStatus.CANCELLED] }
            });

            await Promise.all(orders.map(async (order) => {
                if (order.paymentStatus !== PaymentStatus.PAID) {
                    order.paymentStatus = PaymentStatus.PAID;
                    if (order.paymentMethod !== 'Esewa') order.paymentMethod = 'Counter';
                    await order.save();
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