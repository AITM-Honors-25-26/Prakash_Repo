import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './MenuPage.module.scss';
import Layout from '../../components/layout/layout';
import cartwhite from '../../../img/icons/cart.white.png';

// 1. Define the Interface to fix the 'any' ESLint error
interface BakeryItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string; public_id: string }[];
  category: string;
  stock: number;
  isAvailable: boolean;
}

const MenuPage: React.FC = () => {
  // 2. Use the interface instead of 'any'
  const [menuItems, setMenuItems] = useState<BakeryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get('http://localhost:9005/api/menu/list');
        
        // 3. Extract the result from your backend response
        const data = response.data?.result;

        // Handle if backend returns a single object or an array
        if (Array.isArray(data)) {
          setMenuItems(data);
        } else if (data && typeof data === 'object') {
          setMenuItems([data]); 
        }
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className={styles.main}>
          <div className={styles.topic}><h1>Loading Menu...</h1></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.main}>
        <div className={styles.topic}>
          <h1>Hot sales</h1>
        </div>
        
        <div className={styles.itemSection}>
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <div key={item._id} className={styles.photosection}>
                <img
                  src={item.images && item.images.length > 0 
                    ? item.images[0].url 
                    : 'https://via.placeholder.com/150'} 
                  alt={item.name} 
                />
                
                <div className={styles.overlay}>
                  <h3>{item.name || "Bakery Item"}</h3>
                  <p>{item.description}</p>
                  <p>${item.price ? Number(item.price).toFixed(2) : '0.00'}</p>
                  
                  <div className={styles.buttonDiv}>
                    Add to cart 
                    <img src={cartwhite} alt="Cart icon" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.topic}><p>No items found in the menu.</p></div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MenuPage;