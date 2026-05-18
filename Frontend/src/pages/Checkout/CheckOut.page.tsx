import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import styles from './CheckoutPage.module.scss';
import Layout from '../../components/layout/layout';

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
  
  // Form Details State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    orderType: 'Dine-In', // Default value
    tableNumber: '',
    notes: ''
  });

  // Load items from local storage
  const loadCart = () => {
    const existingCart = localStorage.getItem('bakery_cart');
    if (existingCart) {
      setCartItems(JSON.parse(existingCart));
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  // Update item quantities directly on the checkout screen
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
    window.dispatchEvent(new Event('cartUpdated')); // Keep menu counter in sync
  };

  // Remove item completely
  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item._id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('bakery_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.info("Item removed from cart.");
  };

  // Compute Total Cost
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Order Process (Updated to Client-Side Prototype Simulation)
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    // Basic Validation
    if (!formData.name || !formData.phone) {
      toast.error("Please fill in your name and phone number.");
      return;
    }
    if (formData.orderType === 'Dine-In' && !formData.tableNumber) {
      toast.error("Please provide your table number.");
      return;
    }

    setLoading(true);

    // Simulate backend network delay (1.2 seconds)
    setTimeout(async () => {
      try {
        // Clear Cart local storage completely on client success
        localStorage.removeItem('bakery_cart');
        
        // Let the rest of the application (like Navbar badge counts) know the cart cleared
        window.dispatchEvent(new Event('cartUpdated'));

        // SweetAlert message confirming data successfully processed on the client side
        await MySwal.fire({
          title: 'Order Placed! 🎂',
          text: 'Thank you! Your simulated bakery order has been processed.',
          icon: 'success',
          confirmButtonColor: '#d84315'
        });

        navigate('/menu'); // Take user back to the menu screen
      } catch (error) {
        console.error("Order processing failed:", error);
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
          <h1>Review Your Order</h1>
          <p>Double-check your choices before we bake them up!</p>
        </div>

        {cartItems.length === 0 ? (
          <div className={styles.emptyCart}>
            <p>Your cart is empty. Let's fix that!</p>
            <button className={styles.backBtn} onClick={() => navigate('/menu')}>
              Back to Menu
            </button>
          </div>
        ) : (
          <div className={styles.checkoutGrid}>
            
            {/* Left Side: Service Details Form */}
            <div className={styles.formSection}>
              <h2>Details</h2>
              <form onSubmit={handlePlaceOrder}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="orderType">Order Context</label>
                  <select
                    id="orderType"
                    name="orderType"
                    value={formData.orderType}
                    onChange={handleInputChange}
                  >
                    <option value="Dine-In">Dine-In (At Table)</option>
                    <option value="Takeaway">Takeaway</option>
                  </select>
                </div>

                {formData.orderType === 'Dine-In' && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="tableNumber">Table Number *</label>
                    <input
                      type="text"
                      id="tableNumber"
                      name="tableNumber"
                      placeholder="e.g. Table 4"
                      value={formData.tableNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label htmlFor="notes">Special Notes (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Eggless, extra sugar, allergies, etc..."
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Confirming Order...' : `Place Order (Rs. ${calculateTotal().toLocaleString()})`}
                </button>
              </form>
            </div>

            {/* Right Side: Order Items Panel Summary */}
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
                        Rs. ${(item.price * item.quantity).toLocaleString()}
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

          </div>
        )}
      </div>
    </Layout>
  );
};

export default CheckoutPage;