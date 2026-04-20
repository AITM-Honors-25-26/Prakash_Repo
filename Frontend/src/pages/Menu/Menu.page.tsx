import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './MenuPage.module.scss';
import Layout from '../../components/layout/layout';
import cartwhite from '../../../img/icons/cart.white.png';
import { API_ENDPOINTS } from '../../constants/constants';
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
  const [menuItems, setMenuItems] = useState<BakeryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.LISTALLITEMS);
        const data = response.data?.result;
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
          <h1>Breads</h1>
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
                  <div className={styles.deleteButton}>Delete Item</div>
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