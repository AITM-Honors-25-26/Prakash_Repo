import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './FloatingOrderTracker.module.scss';

interface ActiveOrder {
  orderId: string;
  tableNumber?: string;
  createdAt?: number;
}

const ACTIVE_ORDER_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const FloatingOrderTracker: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const readActiveOrder = (): ActiveOrder | null => {
    const stored = localStorage.getItem('bakery_active_order');
    if (!stored) return null;
    try {
      const parsed: ActiveOrder = JSON.parse(stored);
      if (parsed.createdAt && Date.now() - parsed.createdAt > ACTIVE_ORDER_MAX_AGE_MS) {
        localStorage.removeItem('bakery_active_order');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(readActiveOrder);

  useEffect(() => {
    const handleUpdate = () => setActiveOrder(readActiveOrder());
    window.addEventListener('activeOrderUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('activeOrderUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isOnTrackingPage = location.pathname
    .toLowerCase()
    .includes(`/ordertracking/${activeOrder?.orderId?.toLowerCase() || ''}`);

  if (!activeOrder || isOnTrackingPage) {
    return null;
  }

  return (
    <div
      className={styles.floatingContainer}
      onClick={() => navigate(`/OrderTracking/${activeOrder.orderId}`)}
    >
      <span className={styles.pulseDot} />
      <span className={styles.trackText}>Track Order</span>
    </div>
  );
};

export default FloatingOrderTracker;
