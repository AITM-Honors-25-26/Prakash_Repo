import React, { useEffect, useState } from 'react';
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

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<string>('Pay Later');

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
  }, []);

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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    if (!tableNumber) {
      toast.error('Table mapping missing! Please rescan your QR code.');
      return;
    }

    setLoading(true);

    try {
      // Build the order payload matching the backend schema
      const orderPayload = {
        tableNumber,
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialNotes: item.specialNotes || '',
        })),
      };

      // POST to backend — this saves the order AND triggers io.emit('kitchen_new_order')
      await axios.post(API_ENDPOINTS.ORDER_ACTION + '/', orderPayload);

      // Clear cart after confirmed server response
      localStorage.removeItem('bakery_cart');
      window.dispatchEvent(new Event('cartUpdated'));

      if (paymentOption === 'Pay Now') {
        await MySwal.fire({
          title: 'Redirecting to Payment Gateway...',
          text: `Order confirmed for Table ${tableNumber}. Loading online checkout options...`,
          icon: 'info',
          confirmButtonColor: '#d84315',
        });
      } else {
        await MySwal.fire({
          title: 'Order Sent to Kitchen! 🍳',
          text: `Table ${tableNumber}, your order is being prepared. Pay at the counter when you leave!`,
          icon: 'success',
          confirmButtonColor: '#d84315',
        });
      }

      navigate('/MenuPage');
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
                      src={item.images?.[0]?.url || 'https://via.placeholder.com/100'}
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
                        Pay right now using your phone via cards or digital wallets.
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
      </div>
    </Layout>
  );
};

export default CheckoutPage;