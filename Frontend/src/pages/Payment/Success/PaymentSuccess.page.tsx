import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './PaymentSuccess.module.scss';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    localStorage.removeItem('bakery_cart');
    window.dispatchEvent(new Event('cartUpdated'));
  }, []);

  return (
    <div className={styles.resultContainer}>
      <div className={styles.card}>
        <div className={styles.icon}>✓</div>
        <h1>Payment Successful</h1>
        {amount && <p className={styles.amount}>Rs. {Number(amount).toLocaleString()}</p>}
        {orderId && <p className={styles.orderRef}>Order #{orderId.slice(-6).toUpperCase()}</p>}
        <p className={styles.subText}>You can close this tab, or head back to the menu.</p>
        <button className={styles.btn} onClick={() => navigate('/MenuPage')}>
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
