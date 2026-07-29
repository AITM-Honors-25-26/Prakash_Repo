import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/layout';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './Order.page.module.scss';
import { API_ENDPOINTS } from '../../constants/constants.js'; // Adjust path as needed
import { getSessionId } from '../../utils/session.js'; // Adjust path as needed

// Defining the order structure based on standard restaurant tracking
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  tableNumber?: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served';
  createdAt: string;
}

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Retrieve user and table data just like the Homepage and Header
  const [userData] = useState(() => {
    const userString = localStorage.getItem('qr_user');
    if (userString) {
      try {
        return JSON.parse(userString);
      } catch  {
        return null;
      }
    }
    return null;
  });

  const activeTable = localStorage.getItem('bakery_table');
  const isLoggedIn = !!userData;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // If logged in, fetch by user token. If not, fetch by table/session ID.
        const token = localStorage.getItem('qr_accessToken');
        const sessionId = getSessionId();

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = token ? {} : { sessionId, tableNumber: activeTable };

        // Replace with your actual endpoint for fetching orders
        const response = await axios.get(API_ENDPOINTS.GET_USER_ORDERS, {
          headers,
          params
        });

        setOrders(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch orders", err);
        setError("We couldn't load your orders right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeTable]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Pending': return styles.statusPending;
      case 'Preparing': return styles.statusPreparing;
      case 'Ready': return styles.statusReady;
      case 'Served': return styles.statusServed;
      default: return '';
    }
  };

  return (
    <Layout>
      <div className={styles.orderContainer}>
        <div className={styles.headerSection}>
          <h1>My Orders</h1>
          <p className={styles.subtitle}>Track your freshly baked treats</p>
        </div>

        {!isLoggedIn && !activeTable && (
          <div className={styles.emptyState}>
            <p>You need to scan a table QR code or log in to view your orders.</p>
            <Link to="/LoginPage" className={styles.actionBtn}>Login Now</Link>
          </div>
        )}

        {loading && <div className={styles.loader}>Loading your orders...</div>}
        
        {!loading && error && <div className={styles.errorMessage}>{error}</div>}

        {!loading && !error && orders.length === 0 && (isLoggedIn || activeTable) && (
          <div className={styles.emptyState}>
            <p>You haven't placed any orders yet!</p>
            <Link to="/MenuPage" className={styles.actionBtn}>Browse Menu</Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className={styles.orderList}>
            {orders.map((order) => (
              <div key={order._id} className={styles.orderCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</span>
                    <span className={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                    {order.status}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <ul className={styles.itemList}>
                    {order.items.map((item, index) => (
                      <li key={index}>
                        <span className={styles.itemName}>{item.quantity}x {item.name}</span>
                        <span className={styles.itemPrice}>Rs. {item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.totalLabel}>Total Amount:</span>
                  <span className={styles.totalValue}>Rs. {order.totalPrice}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyOrders;