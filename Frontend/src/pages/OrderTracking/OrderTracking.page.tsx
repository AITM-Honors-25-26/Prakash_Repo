import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useParams, useNavigate, Link } from 'react-router-dom';

import Layout from '../../components/layout/layout';
import styles from './OrderTrackingPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import { API_ENDPOINTS, SOCKET_URL } from '../../constants/constants';

interface AddOnOption {
  name: string;
  price: number;
}

interface OrderItem {
  itemId?: string;
  name: string;
  quantity: number;
  price: number;
  basePrice?: number;
  selectedAddOns?: AddOnOption[];
  specialNotes?: string;
}

interface TrackedOrder {
  _id: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Pending' | 'Paid' | 'Failed';
  paymentMethod: 'Counter' | 'Esewa';
  tableNumber: string;
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
  createdAt: string;
}

const STEPS: { key: TrackedOrder['status']; label: string; hint: string }[] = [
  { key: 'Pending', label: 'Order Received', hint: 'Your order has reached the kitchen.' },
  { key: 'Preparing', label: 'Preparing', hint: 'Our chefs are cooking it up now.' },
  { key: 'Ready', label: 'Ready to Serve', hint: 'Your order is ready! It will be brought to your table shortly.' },
];

const POLL_FALLBACK_MS = 8000;

const clearActiveOrder = (orderId: string) => {
  const stored = localStorage.getItem('bakery_active_order');
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    if (parsed.orderId === orderId) {
      localStorage.removeItem('bakery_active_order');
      window.dispatchEvent(new Event('activeOrderUpdated'));
    }
  } catch {
    localStorage.removeItem('bakery_active_order');
  }
};

const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [draftItems, setDraftItems] = useState<OrderItem[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [tableOrders, setTableOrders] = useState<TrackedOrder[]>([]);
  const tableNumberRef = useRef<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTableOrders = useCallback(async (tableNumber: string) => {
    try {
      const { data } = await axios.get(`${API_ENDPOINTS.ORDER_BY_TABLE}/${tableNumber}/active`);
      if (Array.isArray(data.data)) {
        setTableOrders(data.data.filter((o: TrackedOrder) => o._id !== orderId));
      }
    } catch (err) {
      console.error('Failed to fetch table orders:', err);
    }
  }, [orderId]);

  const fetchOrder = useCallback(async (showLoading = false) => {
    if (!orderId) return;
    if (showLoading) setLoading(true);
    try {
      const { data } = await axios.get(`${API_ENDPOINTS.ORDER_STATUS}/${orderId}/status`);
      setOrder(data.data);
      setError(null);
      tableNumberRef.current = data.data.tableNumber;
      fetchTableOrders(data.data.tableNumber);

      if (data.data.status !== 'Pending') {
        setIsEditing(false);
      }

      if (data.data.status === 'Cancelled') {
        clearActiveOrder(orderId);
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('We could not find this order. It may have been completed or removed.');
        clearActiveOrder(orderId);
      } else {
        setError('Failed to load order status.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, fetchTableOrders]);

  useEffect(() => {
    fetchOrder(true);

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setLiveConnected(true));
    socket.on('disconnect', () => setLiveConnected(false));
    socket.on('connect_error', () => setLiveConnected(false));

    socket.on('order_status_updated', (updatedOrder: TrackedOrder) => {
      if (updatedOrder._id === orderId) {
        if (updatedOrder.status === 'Completed') {
          toast.success('Your order has been served. Enjoy your meal!');
          clearActiveOrder(orderId as string);
        }
        if (updatedOrder.status !== 'Pending') {
          setIsEditing(false);
        }
        fetchOrder(false);
      } else if (tableNumberRef.current && updatedOrder.tableNumber === tableNumberRef.current) {
        fetchTableOrders(tableNumberRef.current);
      }
    });

    socket.on('order_items_updated', (updatedOrder: TrackedOrder) => {
      if (updatedOrder._id === orderId) {
        setOrder(updatedOrder);
      } else if (tableNumberRef.current && updatedOrder.tableNumber === tableNumberRef.current) {
        fetchTableOrders(tableNumberRef.current);
      }
    });

    socket.on('kitchen_new_order', (newOrder: TrackedOrder) => {
      if (newOrder._id !== orderId && tableNumberRef.current && newOrder.tableNumber === tableNumberRef.current) {
        fetchTableOrders(tableNumberRef.current);
      }
    });

    pollRef.current = setInterval(() => fetchOrder(false), POLL_FALLBACK_MS);

    return () => {
      socket.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, fetchOrder, fetchTableOrders]);

  const startEditing = () => {
    if (!order) return;
    setDraftItems(order.items.map((item) => ({ ...item })));
    setEditError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const changeDraftQuantity = (index: number, amount: number) => {
    setDraftItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item
      )
    );
  };

  const removeDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const changeDraftNotes = (index: number, notes: string) => {
    setDraftItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, specialNotes: notes } : item))
    );
  };

  const saveEdit = async () => {
    if (!orderId) return;

    if (draftItems.length === 0) {
      setEditError('An order needs at least one item. Use "Cancel Order" instead if you want to cancel the whole thing.');
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      const { data } = await axios.patch(`${API_ENDPOINTS.ORDER_STATUS}/${orderId}/items`, {
        items: draftItems,
      });
      setOrder(data.data);
      setIsEditing(false);
      toast.success('Your order has been updated.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setEditError(err.response.data?.message || 'This order has already started preparing and can no longer be modified.');
        fetchOrder(false);
      } else {
        setEditError('Could not save your changes. Please try again.');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelOrder = async () => {
    if (!orderId) return;
    if (!window.confirm('Cancel this entire order? This cannot be undone.')) return;

    setCancelling(true);
    try {
      const { data } = await axios.patch(`${API_ENDPOINTS.ORDER_STATUS}/${orderId}/cancel`);
      setOrder(data.data);
      setIsEditing(false);
      clearActiveOrder(orderId);
      toast.info('Your order has been cancelled.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error(err.response.data?.message || 'This order has already started preparing and can no longer be cancelled.');
        fetchOrder(false);
      } else {
        toast.error('Could not cancel your order. Please try again.');
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loader}>
          <img src={LoaderGif} alt="Loading..." />
          <h1>Fetching your order...</h1>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.errorContainer}>
            <h2>{error || 'Order not found.'}</h2>
            <button className={styles.primaryBtn} onClick={() => navigate('/MenuPage')}>
              Back to Menu
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentStepIndex = STEPS.findIndex((step) => step.key === order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Order Tracking</h1>
            <p>Table {order.tableNumber} &middot; Order #{order._id.slice(-6).toUpperCase()}</p>
          </div>
          <span className={`${styles.liveBadge} ${liveConnected ? styles.live : styles.offline}`}>
            {liveConnected ? '● Live' : '○ Reconnecting...'}
          </span>
        </header>

        {isCancelled ? (
          <div className={styles.cancelledBanner}>
            <h2>This order was cancelled.</h2>
            <p>If you think this is a mistake, please speak to a staff member at the counter.</p>
          </div>
        ) : (
          <div className={styles.stepper}>
            {STEPS.map((step, index) => {
              const isDone = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              return (
                <div
                  key={step.key}
                  className={`${styles.step} ${isDone ? styles.done : ''} ${isActive ? styles.active : ''}`}
                >
                  <div className={styles.stepCircle}>{isDone ? '✓' : index + 1}</div>
                  <div className={styles.stepText}>
                    <strong>{step.label}</strong>
                    {isActive && <span>{step.hint}</span>}
                  </div>
                  {index < STEPS.length - 1 && <div className={styles.stepLine} />}
                </div>
              );
            })}
          </div>
        )}

        {tableOrders.length > 0 && (
          <section className={styles.otherOrdersSection}>
            <h2>Other Orders at This Table</h2>
            <div className={styles.otherOrdersList}>
              {tableOrders.map((o) => (
                <div key={o._id} className={styles.otherOrderCard}>
                  <div className={styles.otherOrderHeader}>
                    <span>Order #{o._id.slice(-6).toUpperCase()}</span>
                    <span className={`${styles.statusPill} ${styles[o.status.toLowerCase()] || ''}`}>
                      {o.status}
                    </span>
                  </div>
                  <ul className={styles.otherOrderItems}>
                    {o.items.map((item, idx) => (
                      <li key={idx}>{item.quantity}× {item.name}</li>
                    ))}
                  </ul>
                  <div className={styles.otherOrderTotal}>Rs. {o.totalPrice.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className={styles.detailsGrid}>
          <section className={styles.card}>
            <div className={styles.itemsHeaderRow}>
              <h2>Your Items</h2>
              {order.status === 'Pending' && !isEditing && (
                <div className={styles.headerActions}>
                  <button className={styles.editToggleBtn} onClick={startEditing} disabled={cancelling}>
                    Edit Order
                  </button>
                  <button className={styles.cancelOrderBtn} onClick={cancelOrder} disabled={cancelling}>
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className={styles.itemsList}>
                {order.items.map((item, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <div className={styles.itemInfo}>
                      <strong>{item.quantity}× {item.name}</strong>
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <div className={styles.addOnTags}>
                          {item.selectedAddOns.map((addOn) => (
                            <span key={addOn.name} className={styles.addOnTag}>+ {addOn.name}</span>
                          ))}
                        </div>
                      )}
                      {item.specialNotes && (
                        <p className={styles.itemNotes}>"{item.specialNotes}"</p>
                      )}
                    </div>
                    <span className={styles.itemAmount}>
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.itemsList}>
                <p className={styles.editHint}>You can adjust quantities, notes, or remove items until the kitchen starts preparing your order.</p>
                {draftItems.map((item, idx) => (
                  <div key={idx} className={styles.itemRowEdit}>
                    <div className={styles.itemInfo}>
                      <strong>{item.name}</strong>
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <div className={styles.addOnTags}>
                          {item.selectedAddOns.map((addOn) => (
                            <span key={addOn.name} className={styles.addOnTag}>+ {addOn.name}</span>
                          ))}
                        </div>
                      )}
                      <div className={styles.quantityStepperSmall}>
                        <button type="button" onClick={() => changeDraftQuantity(idx, -1)} disabled={item.quantity <= 1}>−</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => changeDraftQuantity(idx, 1)}>+</button>
                      </div>
                      <textarea
                        className={styles.notesInputSmall}
                        value={item.specialNotes || ''}
                        onChange={(e) => changeDraftNotes(idx, e.target.value)}
                        placeholder="Special instructions..."
                        maxLength={200}
                        rows={1}
                      />
                    </div>
                    <div className={styles.itemEditActions}>
                      <span className={styles.itemAmount}>
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        className={styles.removeItemBtn}
                        onClick={() => removeDraftItem(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {editError && <p className={styles.editErrorMsg}>{editError}</p>}

                <div className={styles.editActionsRow}>
                  <button className={styles.secondaryBtn} onClick={cancelEditing} disabled={savingEdit}>
                    Cancel
                  </button>
                  <button className={styles.primaryBtn} onClick={saveEdit} disabled={savingEdit}>
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2>Bill Summary</h2>
            <div className={styles.billRow}>
              <span>Subtotal</span>
              <span>Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className={styles.billRow}>
                <span>Discount {order.discountCode ? `(${order.discountCode})` : ''}</span>
                <span>- Rs. {order.discountAmount.toLocaleString()}</span>
              </div>
            )}
            {order.membershipDiscountAmount > 0 && (
              <div className={styles.billRow}>
                <span>Loyalty {order.membershipTier ? `(${order.membershipTier})` : ''}</span>
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
            <div className={styles.billTotalRow}>
              <span>Total</span>
              <span>Rs. {order.totalPrice.toLocaleString()}</span>
            </div>

            <div className={styles.paymentStatus}>
              <span>Payment</span>
              <span className={`${styles.paymentBadge} ${styles[order.paymentStatus.toLowerCase()] || ''}`}>
                {order.paymentStatus === 'Paid' ? 'Paid' : order.paymentMethod === 'Esewa' ? 'Awaiting Payment' : 'Pay at Counter'}
              </span>
            </div>
          </section>
        </div>

        <div className={styles.actionsRow}>
          <Link to="/MenuPage" className={styles.secondaryBtn}>
            Order More Items
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default OrderTrackingPage;
