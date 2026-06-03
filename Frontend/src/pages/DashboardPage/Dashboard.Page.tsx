import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import styles from './DashboardPage.module.scss';
import { API_ENDPOINTS } from '../../constants/constants.js';
import Layout from '../../components/layout/layout.js';
import refresh from '../../../img/icons/refresh.white.png';
import kitchen from '../../../img/typeicone/kitchen.png';
import loadinggif from '../../../img/gif/loading.gif';
import service from '../../../img/typeicone/serving.png';

// Socket server is the backend root
const SOCKET_URL = 'http://192.168.1.64:9005';

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  specialNotes?: string;
}

interface Order {
  _id: string;
  tableNumber: string | number;
  items: OrderItem[];
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  createdAt: string;
  totalPrice: number;
}

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);

  // Initial fetch — load all active orders when dashboard first opens
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ORDER_ACTION}/kitchen`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = response.data?.data || response.data?.result || response.data;

      if (Array.isArray(data)) {
        setOrders(data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Socket setup
  useEffect(() => {
    fetchOrders();

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Dashboard connected to socket. ID:', socket.id);
      setConnected(true);
      setError(null);
      socket.emit('join-room', 'kitchen');
    });

    socket.on('disconnect', () => {
      console.log('Dashboard disconnected from socket.');
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setError('Live connection lost. Trying to reconnect...');
      setConnected(false);
    });

    // A customer just placed an order — add it to the top of the queue
    socket.on('kitchen_new_order', (newOrder: Order) => {
      console.log('New order received:', newOrder);
      setOrders(prev => {
        const exists = prev.find(o => o._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
      setError(null);
    });

    // Chef or waiter changed an order's status
    socket.on('order_status_updated', (updatedOrder: Order) => {
      console.log('Order status updated:', updatedOrder);
      setOrders(prev => {
        if (
          updatedOrder.status === 'Completed' ||
          updatedOrder.status === 'Cancelled'
        ) {
          return prev.filter(o => o._id !== updatedOrder._id);
        }
        return prev.map(o => (o._id === updatedOrder._id ? updatedOrder : o));
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update status (Start Cooking, Mark Ready)
  const updateOrderStatus = async (
    orderId: string,
    nextStatus: 'Preparing' | 'Ready'
  ) => {
    try {
      // Optimistic UI Update
      setOrders(prev =>
        prev.map(order =>
          order._id === orderId ? { ...order, status: nextStatus } : order
        )
      );
      
      await axios.patch(
        `${API_ENDPOINTS.ORDER_ACTION}/${orderId}/status`,
        { status: nextStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
      // Rollback optimistic update by re-fetching
      fetchOrders();
    }
  };

  // Permanently delete order when served
  const deleteCompletedOrder = async (orderId: string) => {
    try {
      // Optimistic UI Update: Instantly remove it from screen
      setOrders(prev => prev.filter(order => order._id !== orderId));
      
      // Send DELETE request to backend
      await axios.delete(`${API_ENDPOINTS.ORDER_ACTION}/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
    } catch (err) {
      console.error('Failed to delete order:', err);
      fetchOrders(); // Bring it back if the server fails
    }
  };

  // Filter orders for the different columns
  const kitchenOrders = orders.filter(
    o => o.status === 'Pending' || o.status === 'Preparing'
  );
  const serviceOrders = orders.filter(o => o.status === 'Ready');

  if (loading && orders.length === 0) {
    return (
      <Layout>
        <div className={styles.loading}>
          <img src={loadinggif} alt="Loading" /> 
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.dashboardContainer}>
        <header className={styles.dashHeader}>
          <h1>Live Staff Dashboard</h1>
          <div className={styles.headerRight}>
            <span
              className={`${styles.connectionBadge} ${
                connected ? styles.connected : styles.disconnected
              }`}
            >
            </span>
            <button onClick={fetchOrders} className={styles.refreshBtn}>
              <img src={refresh} alt="Refresh" />
            </button>
          </div>
        </header>
        
        {error && <div className={styles.errorBanner}>{error}</div>}
        
        <div className={styles.boardGrid}>
          {/* KITCHEN STATION */}
          <section className={styles.stationSection}>
            <div className={`${styles.stationHeader} ${styles.kitchenHeader}`}>
              <h2><img src={kitchen} alt="" /> Kitchen Queue <span>({kitchenOrders.length})</span></h2>
            </div>
            <div className={styles.cardContainer}>
              {kitchenOrders.length === 0 ? (
                <p className={styles.emptyMsg}>No meals to prepare right now.</p>
              ) : (
                kitchenOrders.map(order => (
                  <div
                    key={order._id}
                    className={`${styles.orderCard} ${styles[order.status.toLowerCase()]}`}
                  >
                    <div className={styles.cardTop}>
                      <h3>Table {order.tableNumber}</h3>
                      <span className={styles.timeTag}>
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <ul className={styles.itemList}>
                      {order.items.map((item, index) => (
                        <li key={item._id || index} className={styles.itemRow}>
                          <span className={styles.qty}>{item.quantity}x</span>
                          <div className={styles.itemDetails}>
                            <p className={styles.itemName}>{item.name}</p>
                            {item.specialNotes && (
                              <span className={styles.notes}>📝 {item.specialNotes}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.cardActions}>
                      {order.status === 'Pending' ? (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Preparing')}
                          className={styles.actionBtnStart}
                        >
                          Start Cooking
                        </button>
                      ) : (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Ready')}
                          className={styles.actionBtnReady}
                        >
                          Mark Ready 🎉
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* SERVICE STATION */}
          <section className={styles.stationSection}>
            <div className={`${styles.stationHeader} ${styles.serviceHeader}`}>
              <h2><img src={service} alt="" /> Service & Delivery <span>({serviceOrders.length})</span></h2>
            </div>
            <div className={styles.cardContainer}>
              {serviceOrders.length === 0 ? (
                <p className={styles.emptyMsg}>No orders waiting to go out.</p>
              ) : (
                serviceOrders.map(order => (
                  <div
                    key={order._id}
                    className={`${styles.orderCard} ${styles.readyCard}`}
                  >
                    <div className={styles.cardTop}>
                      <h3>Table {order.tableNumber}</h3>
                      <span className={styles.readyBadge}>Ready to Serve</span>
                    </div>

                    <ul className={styles.itemList}>
                      {order.items.map((item, index) => (
                        <li key={item._id || index} className={styles.itemRow}>
                          <span className={styles.qty}>{item.quantity}x</span>
                          <span className={styles.itemName}>{item.name}</span>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.cardActions}>
                      <button
                        onClick={() => deleteCompletedOrder(order._id)}
                        className={styles.actionBtnComplete}
                      >
                        Served & Completed ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;