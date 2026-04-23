import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; 
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const fetchMenu = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
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
      toast.error("Failed to load menu items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user'); 
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'Admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    fetchMenu();
  }, [fetchMenu]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`${API_ENDPOINTS.MENU_ACTION}/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        toast.success("Item deleted successfully!");
        await fetchMenu(false); 
      } catch (error: unknown) {
        let errorMsg = "Failed to delete item.";
        if (axios.isAxiosError(error)) {
          errorMsg = error.response?.data?.message || error.message || errorMsg;
        }
        toast.error(errorMsg);
      }
    }
  };

  const renderCategorySection = (title: string, categoryName: string) => {
    const filteredItems = menuItems.filter(item => item.category === categoryName);

    if (filteredItems.length === 0) return null;

    return (
      <>
        <div className={styles.topic}>
          <h1>{title}</h1>
        </div>
        <div className={styles.itemSection}>
          {filteredItems.map((item) => (
            <div key={item._id} className={styles.photosection}>
              <img
                src={item.images && item.images.length > 0 
                  ? item.images[0].url 
                  : 'https://via.placeholder.com/150'} 
                alt={item.name} 
              />
              <div className={styles.overlay}>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <p>Rs {Number(item.price).toFixed(2)}</p>
                <div className={styles.buttonDiv}>
                  Add to cart <img src={cartwhite} alt="Cart icon" />
                </div>
                {isAdmin && (
                  <div className={styles.deleteButton} onClick={() => handleDelete(item._id)}>
                    Delete Item
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

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
        {/* Render Breads Section */}
        {renderCategorySection("Breads", "Bread")}

        {/* Render Cakes Section */}
        {renderCategorySection("Cakes", "Cake")}

        {/* Fallback if both are empty */}
        {menuItems.length === 0 && (
          <div className={styles.topic}>
            <p>No items found in the menu.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MenuPage;