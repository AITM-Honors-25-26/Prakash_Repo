import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './FloatingCart.module.scss';
import cart from './../../../img/icons/cart1.png'

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
        <img src={cart} alt="" className={styles.cartIcon} />
        <span className={styles.badge}>{totalItems}</span>
      </div>
      <span className={styles.floatingText}>View Cart</span>
    </div>
  );
};

export default FloatingCart;