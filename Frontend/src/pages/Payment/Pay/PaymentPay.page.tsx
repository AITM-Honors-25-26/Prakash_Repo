import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS, API_BASE_URL } from '../../../constants/constants';
import styles from './PaymentPay.module.scss';

// Opened when the customer scans the QR shown on the checkout page's "Pay
// Now" modal. Looks up the order, gets a fresh eSewa signature, and
// auto-submits the hidden form so eSewa's own payment screen takes over.
const PaymentPay: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!orderId) {
      setError('Missing order reference.');
      return;
    }

    const payNow = async () => {
      try {
        const { data: orderRes } = await axios.get(`${API_ENDPOINTS.ORDER_STATUS}/${orderId}/status`);
        const order = orderRes.data;

        if (order.paymentStatus === 'Paid') {
          window.location.href = `/payment/success?orderId=${orderId}`;
          return;
        }

        const totalAmount = order.totalPrice.toString();

        const { data } = await axios.post(API_ENDPOINTS.ESEWA_INIT, {
          amount: totalAmount,
          transaction_uuid: orderId,
        });

        const form = document.createElement('form');
        form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
        form.method = 'POST';

        const fields: Record<string, string> = {
          amount: totalAmount,
          tax_amount: '0',
          total_amount: totalAmount,
          transaction_uuid: orderId,
          product_code: data.product_code,
          signature: data.signature,
          success_url: `${API_BASE_URL}/payment/esewa/success`,
          failure_url: `${API_BASE_URL}/payment/esewa/failure`,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
        };

        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } catch (err) {
        console.error('Failed to start eSewa payment:', err);
        setError('Could not start the payment. Please go back and try again.');
      }
    };

    payNow();
  }, [orderId]);

  return (
    <div className={styles.payContainer}>
      {error ? (
        <p className={styles.errorText}>{error}</p>
      ) : (
        <>
          <div className={styles.spinner} />
          <p>Redirecting you to eSewa...</p>
        </>
      )}
    </div>
  );
};

export default PaymentPay;
