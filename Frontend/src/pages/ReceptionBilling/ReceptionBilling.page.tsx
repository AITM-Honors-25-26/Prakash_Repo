import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Layout from '../../components/layout/layout';
import styles from './ReceptionBillingPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import empty from '../../../img/gif/empty.gif';
import { API_ENDPOINTS, SOCKET_URL } from '../../constants/constants';

const MySwal = withReactContent(Swal);

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  specialNotes?: string;
  selectedAddOns?: { name: string; price: number }[];
}

interface BillingOrder {
  _id: string;
  status: string;
  paymentStatus: 'Unpaid' | 'Pending' | 'Paid' | 'Failed';
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  membershipTier: string | null;
  membershipDiscountPercent: number;
  membershipDiscountAmount: number;
  taxRate: number;
  taxAmount: number;
  serviceChargeRate: number;
  serviceChargeAmount: number;
  totalPrice: number;
  paidAt: string | null;
  createdAt: string;
}

interface TableBilling {
  tableNumber: number;
  status: string;
  location: string;
  occupiedBy: string | null;
  billing: {
    paymentStatus: 'Unpaid' | 'Pending' | 'Paid' | 'Failed';
    outstandingAmount: number;
    activeOrdersCount: number;
  };
  orders: BillingOrder[];
}

interface PaymentsOverview {
  summary: {
    totalOutstanding: number;
    totalPaidToday: number;
    occupiedTables: number;
    paidTables: number;
    unpaidTables: number;
  };
  tables: TableBilling[];
}

type FilterTab = 'All' | 'Unpaid' | 'Paid' | 'Pending' | 'Failed';

const ReceptionBillingPage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<PaymentsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [actionTable, setActionTable] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('qr_accessToken');
    localStorage.removeItem('qr_refreshToken');
    localStorage.removeItem('qr_user');
    toast.error('Session expired. Please log in again.');
    navigate('/LoginPage');
  }, [navigate]);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('qr_accessToken');
    if (!token) {
      handleSessionExpired();
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [handleSessionExpired]);

  const fetchOverview = useCallback(async (showLoader = false) => {
    const config = getAuthHeader();
    if (!config) return;

    if (showLoader) setLoading(true);
    try {
      const { data } = await axios.get(API_ENDPOINTS.PAYMENTS_OVERVIEW, config);
      if (data?.data) setOverview(data.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error('Failed to load payment overview.');
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchOverview(true);

    const interval = setInterval(() => fetchOverview(false), 5000);

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join-room', 'billing'));
    socket.on('table_billing_updated', () => fetchOverview(false));
    socket.on('order_status_updated', () => fetchOverview(false));

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settleTable = async (tableNumber: number) => {
    const config = getAuthHeader();
    if (!config) return;

    const result = await MySwal.fire({
      title: `Settle Table ${tableNumber}?`,
      text: 'Mark every unpaid order at this table as paid (counter payment).',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark Paid',
      confirmButtonColor: '#218838',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    setActionTable(tableNumber);
    try {
      const response = await axios.put(`${API_ENDPOINTS.TABLE_BASE}/${tableNumber}/settle`, {}, config);
      toast.success(response.data?.message || `Table ${tableNumber} bill settled.`);
      fetchOverview(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to settle the bill.');
      }
    } finally {
      setActionTable(null);
    }
  };

  const markAvailable = async (tableNumber: number) => {
    const config = getAuthHeader();
    if (!config) return;

    const result = await MySwal.fire({
      title: `Release Table ${tableNumber}?`,
      text: 'The table will be freed for the next customer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Release Table',
      confirmButtonColor: '#d84315',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    setActionTable(tableNumber);
    try {
      const response = await axios.put(
        `${API_ENDPOINTS.TABLE_BASE}/${tableNumber}/mark-available`,
        {},
        config
      );
      toast.success(response.data?.message || `Table ${tableNumber} is now available.`);
      fetchOverview(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        await MySwal.fire({
          title: 'Bill Not Settled',
          text: error.response?.data?.message || 'This table still has an outstanding bill. Settle it first.',
          icon: 'error',
          confirmButtonColor: '#d84315',
        });
      } else if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to release the table.');
      }
    } finally {
      setActionTable(null);
    }
  };

  const visibleTables = (overview?.tables || []).filter((table) => {
    if (filter === 'All') return true;
    return table.billing.paymentStatus === filter;
  });

  if (loading) {
    return (
      <Layout>
        <div className={styles.loader}>
          <img src={LoaderGif} alt="Loading..." />
          <h1>Loading Payment Overview...</h1>
        </div>
      </Layout>
    );
  }

  const summary = overview?.summary;

  const FILTERS: FilterTab[] = ['All', 'Unpaid', 'Pending', 'Paid', 'Failed'];

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <header className={styles.pageHeader}>
          <h1>Payments &amp; Billing Console</h1>
          <p>Full payment status for every table - settle bills and release tables from here.</p>
        </header>

        <section className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total Outstanding</span>
            <span className={styles.summaryValue}>Rs. {(summary?.totalOutstanding || 0).toLocaleString()}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Paid Today</span>
            <span className={styles.summaryValue}>Rs. {(summary?.totalPaidToday || 0).toLocaleString()}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Occupied Tables</span>
            <span className={styles.summaryValue}>{summary?.occupiedTables || 0}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Paid / Unpaid</span>
            <span className={styles.summaryValue}>
              {summary?.paidTables || 0} / {summary?.unpaidTables || 0}
            </span>
          </div>
        </section>

        <div className={styles.filterRow}>
          {FILTERS.map((tab) => (
            <button
              key={tab}
              className={`${styles.filterBtn} ${filter === tab ? styles.filterActive : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.tableGrid}>
          {visibleTables.length === 0 ? (
            <div className={styles.emptyState}>
              <img src={empty} alt="" />
              <h2>No tables match this filter.</h2>
            </div>
          ) : (
            visibleTables.map((table) => {
              const badgeClass =
                table.billing.paymentStatus === 'Paid'
                  ? styles.paymentPaid
                  : table.billing.paymentStatus === 'Pending'
                    ? styles.paymentPending
                    : table.billing.paymentStatus === 'Failed'
                      ? styles.paymentFailed
                      : styles.paymentUnpaid;

              return (
                <section key={table.tableNumber} className={styles.tableCard}>
                  <div className={styles.tableHeader}>
                    <div>
                      <h2>Table {table.tableNumber}</h2>
                      <p className={styles.tableMeta}>
                        {table.location} · {table.status}
                        {table.occupiedBy ? ` · Session ${table.occupiedBy.slice(0, 8)}` : ''}
                      </p>
                    </div>
                    <span className={`${styles.paymentBadge} ${badgeClass}`}>
                      {table.billing.paymentStatus === 'Paid'
                        ? '✓ Paid'
                        : `${table.billing.paymentStatus} · Rs. ${(table.billing.outstandingAmount || 0).toLocaleString()}`}
                    </span>
                  </div>

                  {table.orders.length === 0 && (
                    <p className={styles.noOrders}>No orders on this table yet.</p>
                  )}

                  {table.orders.map((order) => (
                    <div key={order._id} className={styles.orderBlock}>
                      <div className={styles.orderHeader}>
                        <span className={styles.orderStatus}>
                          {order.status} · {order.paymentMethod}
                        </span>
                        <span className={order.paymentStatus === 'Paid' ? styles.orderPaid : styles.orderUnpaid}>
                          {order.paymentStatus === 'Paid'
                            ? `Paid${order.paidAt ? ` · ${new Date(order.paidAt).toLocaleTimeString()}` : ''}`
                            : `Rs. ${order.totalPrice.toLocaleString()}`}
                        </span>
                      </div>

                      <ul className={styles.itemList}>
                        {order.items.map((item, index) => (
                          <li key={index} className={styles.itemRow}>
                            <span className={styles.qty}>{item.quantity}×</span>
                            <span className={styles.itemName}>{item.name}</span>
                            <span className={styles.itemPrice}>
                              Rs. {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className={styles.billBreakdown}>
                        <div className={styles.billRow}>
                          <span>Subtotal</span>
                          <span>Rs. {order.subtotal.toLocaleString()}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className={styles.billRow}>
                            <span>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</span>
                            <span>- Rs. {order.discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {order.membershipDiscountAmount > 0 && (
                          <div className={styles.billRow}>
                            <span>Loyalty{order.membershipTier ? ` (${order.membershipTier})` : ''}</span>
                            <span>- Rs. {order.membershipDiscountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {order.taxAmount > 0 && (
                          <div className={styles.billRow}>
                            <span>Tax ({order.taxRate}%)</span>
                            <span>Rs. {order.taxAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {order.serviceChargeAmount > 0 && (
                          <div className={styles.billRow}>
                            <span>Service Charge ({order.serviceChargeRate}%)</span>
                            <span>Rs. {order.serviceChargeAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className={`${styles.billRow} ${styles.billTotal}`}>
                          <span>Total</span>
                          <span>Rs. {order.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {table.status === 'Occupied' && (
                    <div className={styles.actionRow}>
                      {table.billing.paymentStatus !== 'Paid' && (
                        <button
                          className={styles.settleBtn}
                          onClick={() => settleTable(table.tableNumber)}
                          disabled={actionTable === table.tableNumber}
                        >
                          {actionTable === table.tableNumber ? 'Processing...' : 'Settle Bill'}
                        </button>
                      )}
                      <button
                        className={styles.releaseBtn}
                        onClick={() => markAvailable(table.tableNumber)}
                        disabled={actionTable === table.tableNumber}
                      >
                        {actionTable === table.tableNumber ? 'Processing...' : 'Release Table'}
                      </button>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReceptionBillingPage;
