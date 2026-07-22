import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './PaymentFailure.module.scss';

const PaymentFailure: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className={styles.resultContainer}>
      <div className={styles.card}>
        <div className={styles.icon}>✕</div>
        <h1>Payment Failed</h1>
        {orderId && <p className={styles.orderRef}>Order #{orderId.slice(-6).toUpperCase()}</p>}
        <p className={styles.subText}>
          Your payment didn't go through. Your order is still saved - you can try paying again,
          or settle it at the counter instead.
        </p>
        <button className={styles.btn} onClick={() => navigate('/CheckoutPage')}>
          Try Again
        </button>
      </div>
    </div>
  );
};

export default PaymentFailure;
