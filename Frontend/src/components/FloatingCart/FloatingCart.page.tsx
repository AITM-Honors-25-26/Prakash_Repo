import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './FloatingCart.module.scss';

interface CartItem {
  _id: string;
  quantity: number;
}

const FloatingCart: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize the state safely with a lazy function callback
  const [totalItems, setTotalItems] = useState<number>(() => {
    const existingCart = localStorage.getItem('bakery_cart');
    if (existingCart) {
      const items: CartItem[] = JSON.parse(existingCart);
      return items.reduce((sum, item) => sum + item.quantity, 0);
    }
    return 0;
  });

  const calculateTotalItems = () => {
    const existingCart = localStorage.getItem('bakery_cart');
    if (existingCart) {
      const items: CartItem[] = JSON.parse(existingCart);
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      setTotalItems(count);
    } else {
      setTotalItems(0);
    }
  };

  useEffect(() => {
    // ONLY bind event listeners here. Do NOT call calculateTotalItems() synchronously on mount.
    window.addEventListener('cartUpdated', calculateTotalItems);
    
    return () => {
      window.removeEventListener('cartUpdated', calculateTotalItems);
    };
  }, []);

  if (totalItems === 0 || location.pathname.toLowerCase().includes('checkoutpage')) {
    return null;
  }

  return (
    <div className={styles.floatingContainer} onClick={() => navigate('/CheckoutPage')}>
      <div className={styles.cartIconWrapper}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={styles.basketIcon}
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span className={styles.badge}>{totalItems}</span>
      </div>
      <span className={styles.floatingText}>View Cart</span>
    </div>
  );
};

export default FloatingCart;