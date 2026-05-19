import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import styles from './CheckoutPage.module.scss';
import Layout from '../../components/layout/layout';
import emptyCart from '../../../img/gif/emptycart.gif';

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
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableNumber, setTableNumber] = useState<string>('');
  
  // Single selection state for the payment method choice
  const [paymentOption, setPaymentOption] = useState<string>('Pay Later');

  useEffect(() => {
    // 1. Load cart items from local storage
    const existingCart = localStorage.getItem('bakery_cart');
    if (existingCart) {
      setCartItems(JSON.parse(existingCart));
    }

    // 2. Load the locked table number captured from the scanned QR url parameter
    const savedTable = localStorage.getItem('bakery_table');
    if (savedTable) {
      setTableNumber(savedTable);
    } else {
      toast.warn("No table detected. Please rescan your table QR code.");
    }
  }, []);

  // Adjust item quantities directly on the layout screen
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

  // Remove individual items completely
  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item._id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('bakery_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.info("Item removed from cart.");
  };

  // Compute Grand Total Cost
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Process the order execution simulation block 100% on the frontend client
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    if (!tableNumber) {
      toast.error("Table mapping missing! Please rescan your QR code.");
      return;
    }

    setTimeout(async () => {
      try {
        // Clear Cart local storage completely on success
        localStorage.removeItem('bakery_cart');
        window.dispatchEvent(new Event('cartUpdated'));

        if (paymentOption === 'Pay Now') {
          await MySwal.fire({
            title: 'Redirecting to Payment Gateways...',
            text: `Order confirmed for Table ${tableNumber}. Loading online checkout options...`,
            icon: 'info',
            confirmButtonColor: '#d84315'
          });
        } else {
          await MySwal.fire({
            title: 'Order Sent to Kitchen! 🍳',
            text: `Table ${tableNumber}, your order has been sent. You can pay at the counter when you leave!`,
            icon: 'success',
            confirmButtonColor: '#d84315'
          });
        }

        navigate('/MenuPage'); // Direct user right back to the regular menu display
      } catch (error) {
        console.error("Order processing encountered an error:", error);
        toast.error("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }, 1200);
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
            <img src={emptyCart} alt="" className={styles.emptyCarticon}/>
            <button className={styles.backBtn} onClick={() => navigate('/MenuPage')}>
              Back to Menu
            </button>
          </div>
        ) : (
          <div className={styles.checkoutGrid}>
            
            {/* Left Side: Order Summary Panel */}
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
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item._id, 1)}>+</button>
                      </div>
                    </div>
                    <div className={styles.itemRightSide}>
                      <span className={styles.subtotal}>
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button 
                        type="button" 
                        className={styles.deleteBtn} 
                        onClick={() => removeItem(item._id)}
                      >
                        ✕
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

            {/* Right Side: Simplified Payment Selection Options Form */}
            <div className={styles.formSection}>
              <h2>Payment Choice</h2>
              <form onSubmit={handlePlaceOrder}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                  
                  {/* Pay Later Option Block */}
                  <label 
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '15px', 
                      padding: '15px', 
                      border: paymentOption === 'Pay Later' ? '2px solid #d84315' : '1px solid #ccc', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      background: paymentOption === 'Pay Later' ? '#fff5f2' : '#fff'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="paymentOption" 
                      value="Pay Later"
                      checked={paymentOption === 'Pay Later'}
                      onChange={(e) => setPaymentOption(e.target.value)}
                      style={{ accentColor: '#d84315', transform: 'scale(1.2)' }}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.1rem' }}>Pay Later (At Counter)</strong>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>Send your items to the kitchen immediately and pay when you finish dining.</span>
                    </div>
                  </label>

                  {/* Pay Now Option Block */}
                  <label 
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '15px', 
                      padding: '15px', 
                      border: paymentOption === 'Pay Now' ? '2px solid #d84315' : '1px solid #ccc', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      background: paymentOption === 'Pay Now' ? '#fff5f2' : '#fff'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="paymentOption" 
                      value="Pay Now"
                      checked={paymentOption === 'Pay Now'}
                      onChange={(e) => setPaymentOption(e.target.value)}
                      style={{ accentColor: '#d84315', transform: 'scale(1.2)' }}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.1rem' }}>Pay Now (Online Payment)</strong>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>Pay right now using your phone via cards or digital wallets.</span>
                    </div>
                  </label>

                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Processing Order...' : `Confirm Order (Rs. ${calculateTotal().toLocaleString()})`}
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