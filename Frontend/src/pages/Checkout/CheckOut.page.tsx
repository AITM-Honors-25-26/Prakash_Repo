import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import styles from './CheckoutPage.module.scss';
import Layout from '../../components/layout/layout';
import emptyCart from '../../../img/gif/emptycart.gif';
import { API_ENDPOINTS } from '../../constants/constants';

const MySwal = withReactContent(Swal);

interface CartItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string; public_id: string }[];
  category: string;
  stock: number;
  quantity: number;
  specialNotes?: string;
}

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<string>('Pay Later');

  // eSewa QR modal state
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [qrImage, setQrImage] = useState<string>('');
  const [checkingPayment, setCheckingPayment] = useState<boolean>(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const existingCart = localStorage.getItem('bakery_cart');
    if (existingCart) {
      setCartItems(JSON.parse(existingCart));
    }

    const savedTable = localStorage.getItem('bakery_table');
    if (savedTable) {
      setTableNumber(savedTable);
    } else {
      toast.warn('No table detected. Please rescan your table QR code.');
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setCheckingPayment(false);
  };

  const updateQuantity = (id: string, amount: number) => {
    const updatedCart = cartItems.map(item => {
      if (item._id === id) {
        const newQty = item.quantity + amount;
        return { ...item, quantity: newQty < 1 ? 1 : newQty };
      }
      return item;
    });
    setCartItems(updatedCart);
    localStorage.setItem('bakery_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item._id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('bakery_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.info('Item removed from cart.');
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const startQrPayment = async (orderId: string, totalAmount: string) => {
    try {
      const { data } = await axios.post(API_ENDPOINTS.ESEWA_QR, {
        amount: totalAmount,
        transaction_uuid: orderId,
      });

      setQrImage(data.data.qrImage);
      setQrModalOpen(true);
      beginPolling(orderId);
    } catch (error) {
      console.error('QR generation failed:', error);
      toast.error('Could not generate payment QR. Please try again.');
    }
  };

  const beginPolling = (orderId: string) => {
    setCheckingPayment(true);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API_ENDPOINTS.ORDER_STATUS}/${orderId}/status`);
        const paymentStatus = data.data.paymentStatus;

        if (paymentStatus === 'Paid') {
          stopPolling();
          setQrModalOpen(false);
          localStorage.removeItem('bakery_cart');
          window.dispatchEvent(new Event('cartUpdated'));

          await MySwal.fire({
            title: 'Payment Received! 🎉',
            text: `Table ${tableNumber}, your order is confirmed and heading to the kitchen.`,
            icon: 'success',
            confirmButtonColor: '#d84315',
          });
          navigate('/MenuPage');
        } else if (paymentStatus === 'Failed') {
          stopPolling();
          setQrModalOpen(false);
          toast.error('Payment failed or was cancelled. Please try again.');
        }
        // 'Pending' / 'Unpaid' -> keep polling
      } catch (error) {
        console.error('Payment status check failed:', error);
      }
    }, POLL_INTERVAL_MS);

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      toast.warn('Payment session timed out. Please try again.');
      setQrModalOpen(false);
    }, POLL_TIMEOUT_MS);
  };

  const handleCancelQr = () => {
    stopPolling();
    setQrModalOpen(false);
    setQrImage('');
    toast.info('Payment cancelled. You can try again anytime.');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        tableNumber,
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialNotes: item.specialNotes || '',
        })),
      };

      // Backend wraps the created order as { success, data: order }
      const response = await axios.post(API_ENDPOINTS.ORDER_ACTION + '/', orderPayload);
      const orderId = response.data.data._id;

      if (paymentOption === 'Pay Now') {
        const totalAmount = calculateTotal().toString();
        await startQrPayment(orderId, totalAmount);
      } else {
        // 'Pay Later'
        localStorage.removeItem('bakery_cart');
        window.dispatchEvent(new Event('cartUpdated'));

        await MySwal.fire({
          title: 'Order Sent to Kitchen! 🍳',
          text: `Table ${tableNumber}, your order is being prepared. Pay at the counter!`,
          icon: 'success',
          confirmButtonColor: '#d84315',
        });
        navigate('/MenuPage');
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.checkoutContainer}>
        <div className={styles.headerSection}>
          <h1>Table {tableNumber || 'N/A'} - Order Review</h1>
          <p>Review your selection and pick how you want to settle the bill.</p>
        </div>

        {cartItems.length === 0 ? (
          <div className={styles.emptyCart}>
            <p>Your cart is empty. Let's fix that!</p>
            <img src={emptyCart} alt="" className={styles.emptyCarticon} />
            <button className={styles.backBtn} onClick={() => navigate('/MenuPage')}>
              Back to Menu
            </button>
          </div>
        ) : (
          <div className={styles.checkoutGrid}>

            <div className={styles.summarySection}>
              <h2>Summary</h2>
              <div className={styles.itemsList}>
                {cartItems.map((item) => (
                  <div key={item._id} className={styles.cartItemRow}>
                    <img
                      src={item.images?.[0]?.url || 'https://via.placeholder.com/150'}
                      alt={item.name}
                      className={styles.itemImage}
                    />
                    <div className={styles.itemInfo}>
                      <h3>{item.name}</h3>
                      <p className={styles.itemPrice}>Rs. {item.price.toLocaleString()}</p>

                      <div className={styles.quantityControls}>
                        <button type="button" onClick={() => updateQuantity(item._id, -1)}>-</button>
                        <span className={styles.itemCount}>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item._id, 1)}>+</button>
                      </div>
                    </div>
                    <div className={styles.itemRightSide}>
                      <span className={styles.subtotal}>
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => removeItem(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <span>Grand Total:</span>
                <span className={styles.totalPrice}>Rs. {calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.formSection}>
              <h2>Payment Choice</h2>
              <form onSubmit={handlePlaceOrder}>

                <div className={styles.radioGroupContainer}>
                  <label
                    className={`${styles.paymentLabel} ${
                      paymentOption === 'Pay Later' ? styles.activeOption : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      value="Pay Later"
                      checked={paymentOption === 'Pay Later'}
                      onChange={(e) => setPaymentOption(e.target.value)}
                      className={styles.radioInput}
                    />
                    <div className={styles.labelTextWrapper}>
                      <strong className={styles.optionTitle}>Pay Later (At Counter)</strong>
                      <span className={styles.optionDescription}>
                        Send your items to the kitchen immediately and pay when you finish dining.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`${styles.paymentLabel} ${
                      paymentOption === 'Pay Now' ? styles.activeOption : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      value="Pay Now"
                      checked={paymentOption === 'Pay Now'}
                      onChange={(e) => setPaymentOption(e.target.value)}
                      className={styles.radioInput}
                    />
                    <div className={styles.labelTextWrapper}>
                      <strong className={styles.optionTitle}>Pay Now (Online Payment)</strong>
                      <span className={styles.optionDescription}>
                        Scan a QR code with your phone's banking app to pay instantly.
                      </span>
                    </div>
                  </label>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Placing Order...' : `Confirm Order (Rs. ${calculateTotal().toLocaleString()})`}
                </button>

              </form>
            </div>

          </div>
        )}

        {qrModalOpen && (
          <div className={styles.qrModalOverlay}>
            <div className={styles.qrModalBox}>
              <h2>Scan to Pay</h2>
              <p>Rs. {calculateTotal().toLocaleString()} &middot; Table {tableNumber}</p>

              {qrImage ? (
                <img src={qrImage} alt="Payment QR Code" className={styles.qrImage} />
              ) : (
                <div className={styles.qrLoading}>Generating QR...</div>
              )}

              <p className={styles.qrHint}>
                Open your banking app, scan the code, and complete the payment.
              </p>

              {checkingPayment && (
                <p className={styles.qrStatus}>
                  <span className={styles.spinner} /> Waiting for payment confirmation...
                </p>
              )}

              <button className={styles.qrCancelBtn} onClick={handleCancelQr}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CheckoutPage;