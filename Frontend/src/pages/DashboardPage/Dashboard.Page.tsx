import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './DashboardPage.module.scss';
import { API_ENDPOINTS } from '../../constants/constants.js';

// Define structures for TypeScript safety
interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  notes?: string;
}

interface Order {
  _id: string;
  tableNumber: string | number;
  items: OrderItem[];
  status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered';
  createdAt: string;
  totalAmount: number;
}

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.LISTALLORDERS || '/api/orders');
      const data = response.data?.data || response.data?.result || response.data;
      
      if (Array.isArray(data)) {
        // Filter out completed/delivered orders to keep the dashboard focused on active tasks
        const activeOrders = data.filter((order: Order) => order.status !== 'Delivered');
        setOrders(activeOrders);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard orders:", err);
      setError("Failed to load live orders. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  // Poll for live orders every 15 seconds to keep kitchen/staff updated
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle progressing order status
  const updateOrderStatus = async (orderId: string, nextStatus: 'Preparing' | 'Ready' | 'Delivered') => {
    try {
      // Optimistic UI update for immediate visual feedback
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: nextStatus } : order
        ).filter(order => order.status !== 'Delivered') // Remove immediately if marked completed
      );

      await axios.patch(`${API_ENDPOINTS.UPDATEORDERSTATUS || '/api/orders'}/${orderId}`, {
        status: nextStatus
      });
    } catch (err) {
      console.error("Failed to update status on server:", err);
      // Rollback or alert staff
      fetchOrders();
    }
  };

  // Segregate orders based on station responsibility
  const kitchenOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing');
  const serviceOrders = orders.filter(o => o.status === 'Ready');

  if (loading && orders.length === 0) return <div className={styles.loader}>Loading Live Orders...</div>;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashHeader}>
        <h1>Live Staff Dashboard</h1>
        <button onClick={fetchOrders} className={styles.refreshBtn}>🔄 Refresh Board</button>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.boardGrid}>
        
        {/* KITCHEN STATION */}
        <section className={styles.stationSection}>
          <div className={`${styles.stationHeader} ${styles.kitchenHeader}`}>
            <h2>🍳 Kitchen Queue <span>({kitchenOrders.length})</span></h2>
          </div>
          <div className={styles.cardContainer}>
            {kitchenOrders.length === 0 ? (
              <p className={styles.emptyMsg}>No meals to prepare right now.</p>
            ) : (
              kitchenOrders.map(order => (
                <div key={order._id} className={`${styles.orderCard} ${styles[order.status.toLowerCase()]}`}>
                  <div className={styles.cardTop}>
                    <h3>Table {order.tableNumber}</h3>
                    <span className={styles.timeTag}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <ul className={styles.itemList}>
                    {order.items.map((item) => (
                      <li key={item._id} className={styles.itemRow}>
                        <span className={styles.qty}>❌ {item.quantity}</span>
                        <div className={styles.itemDetails}>
                          <p className={styles.itemName}>{item.name}</p>
                          {item.notes && <span className={styles.notes}>📝 {item.notes}</span>}
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

        {/* STAFF / SERVICE STATION */}
        <section className={styles.stationSection}>
          <div className={`${styles.stationHeader} ${styles.serviceHeader}`}>
            <h2>🛎️ Service & Delivery <span>({serviceOrders.length})</span></h2>
          </div>
          <div className={styles.cardContainer}>
            {serviceOrders.length === 0 ? (
              <p className={styles.emptyMsg}>No orders waiting to go out.</p>
            ) : (
              serviceOrders.map(order => (
                <div key={order._id} className={`${styles.orderCard} ${styles.readyCard}`}>
                  <div className={styles.cardTop}>
                    <h3>Table {order.tableNumber}</h3>
                    <span className={styles.readyBadge}>Ready to Serve</span>
                  </div>
                  
                  <ul className={styles.itemList}>
                    {order.items.map((item) => (
                      <li key={item._id} className={styles.itemRow}>
                        <span className={styles.qty}>{item.quantity}x</span>
                        <span className={styles.itemName}>{item.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.cardActions}>
                    <button 
                      onClick={() => updateOrderStatus(order._id, 'Delivered')}
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
  );
};

export default Dashboard;