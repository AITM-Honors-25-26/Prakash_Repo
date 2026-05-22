import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useParams, useNavigate } from 'react-router-dom';

import styles from './MenuPage.module.scss';
import Layout from '../../components/layout/layout';

import cartwhite from '../../../img/icons/cart.white.png';
import hot from '../../../img/gif/hot.gif';

import { API_ENDPOINTS, CATAGOTY } from '../../constants/constants';

const MySwal = withReactContent(Swal);

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

interface CartItem extends BakeryItem {
  quantity: number;
}

const MenuPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // Fixed: Needed to make the add button route somewhere

  const [menuItems, setMenuItems] = useState<BakeryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchMenu = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axios.get(API_ENDPOINTS.LISTALLITEMS);
      const data = response.data?.result;

      if (Array.isArray(data)) {
        setMenuItems(data);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      localStorage.setItem('bakery_table', id);
      toast.success(`Serving Table: ${id}`, { autoClose: 3000 });
    }
  }, [id]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setIsAdmin(parsed.role === 'Admin');
      } catch (error) {
        console.error(error);
      }
    }

    fetchMenu();

    const interval = setInterval(() => {
      fetchMenu(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchMenu]);

  const groupedItems = useMemo(() => {
    return Object.values(CATAGOTY).map((category) => ({
      category,
      items: menuItems.filter((item) => item.category === category),
    }));
  }, [menuItems]);

  const handleAddToCart = (item: BakeryItem) => {
    try {
      const existingCart = localStorage.getItem('bakery_cart');
      const cart: CartItem[] = existingCart ? JSON.parse(existingCart) : [];

      // Fixed: Replaced 'any' with explicit CartItem type definition
      const existingItem = cart.find(
        (cartItem: CartItem) => cartItem._id === item._id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          ...item,
          quantity: 1,
        });
      }

      localStorage.setItem('bakery_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success(`${item.name} added to cart`);
    } catch (error) {
      console.error(error);
      toast.error('Unable to add item');
    }
  };

  const handleDelete = async (itemId: string) => {
    const user = localStorage.getItem('user');
    if (!user) return;

    const parsed = JSON.parse(user);

    const { value: password } = await MySwal.fire({
      title: 'Admin Verification',
      input: 'password',
      inputPlaceholder: 'Enter password',
      showCancelButton: true,
      confirmButtonColor: '#ff6b35',
    });

    if (!password) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_ENDPOINTS.MENU_ACTION}/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          email: parsed.email,
          password,
        },
      });

      toast.success('Item deleted');
      fetchMenu(false);
    } catch  {
      toast.error('Delete failed');
    }
  };
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Our Menu</h1>
          <p>Freshly baked happiness every day</p>

          {isAdmin && (
            <button 
              className={styles.adminBtn}
              onClick={() => navigate('/admin/menu/create')}
            >
              + Add New Item
            </button>
          )}
        </div>
        {loading ? (
          <div className={styles.loader}>
            <h2>Loading Menu...</h2>
          </div>
        ) : (
          <>
            {groupedItems.map(({ category, items }) => {
              if (items.length === 0) return null;

              return (
                <section key={category} className={styles.categorySection}>
                  <h2 className={styles.categoryTitle}>{category}</h2> 
                  <div className={styles.grid}>
                    {items.map((item) => (
                      <div key={item._id} className={styles.card}>
                        <div className={styles.imageWrapper}>
                          <img
                            src={item.images?.[0]?.url || 'https://via.placeholder.com/500'}
                            alt={item.name}
                          />
                          {!item.isAvailable && (
                            <span className={styles.outOfStock}>Unavailable</span>
                          )}
                        </div>
                        <div className={styles.content}>
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                          </div>
                          <div className={styles.bottom}>
                            <span className={styles.price}>Rs. {item.price}</span>
                            <button
                              disabled={!item.isAvailable}
                              onClick={() => handleAddToCart(item)}
                              className={styles.cartBtn}
                            >
                              <img src={cartwhite} alt="" />
                              Add
                            </button>
                          </div>
                          {isAdmin && (
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(item._id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            {menuItems.length === 0 && (
              <div className={styles.empty}>
                <img src={hot} alt="" />
                <h2>No Items Found</h2>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
export default MenuPage;