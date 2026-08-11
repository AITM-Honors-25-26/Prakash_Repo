import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useParams, useNavigate } from 'react-router-dom';

import styles from './MenuPage.module.scss';
import Layout from '../../components/layout/layout';
import ItemDetailModal from '../../components/ItemDetail/ItemDetailsPage';
import type { CartCustomization } from '../../components/ItemDetail/ItemDetailsPage';

import cartwhite from '../../../img/icons/cart.white.png';
import hot from '../../../img/gif/hot.gif';

import { API_ENDPOINTS } from '../../constants/constants';

const MySwal = withReactContent(Swal);

interface AddOnOption {
  name: string;
  price: number;
}

interface BakeryItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string; public_id: string }[];
  category: string;
  stock: number;
  isAvailable: boolean;
  addOns?: AddOnOption[];
}

export interface CartItem extends BakeryItem {
  cartLineId: string;
  quantity: number;
  unitPrice: number;
  selectedAddOns: AddOnOption[];
  specialNotes: string;
}

const MenuItemCard: React.FC<{
  item: BakeryItem;
  isAdmin: boolean;
  handleAddToCart: (item: BakeryItem) => void;
  handleDelete: (id: string) => void;
  onClick: () => void;
}> = ({ item, isAdmin, handleAddToCart, handleDelete, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasMultipleImages = item.images && item.images.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
  };

  return (
    <div className={styles.card} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className={styles.imageWrapper}>
        <img
          src={item.images?.[currentImageIndex]?.url || 'https://via.placeholder.com/500'}
          alt={`${item.name} - ${currentImageIndex + 1}`}
        />

        {hasMultipleImages && (
          <>
            <button className={`${styles.sliderBtn} ${styles.left}`} onClick={prevImage}>
              ❮
            </button>
            <button className={`${styles.sliderBtn} ${styles.right}`} onClick={nextImage}>
              ❯
            </button>
            <div className={styles.dotsContainer}>
              {item.images.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${idx === currentImageIndex ? styles.active : ''}`}
                />
              ))}
            </div>
          </>
        )}

        {!item.isAvailable && (
          <span className={styles.outOfStock}>Unavailable</span>
        )}
      </div>

      <div className={styles.content}>
        <div>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
        <div className={styles.bottompart}>
          <div className={styles.bottom}>
            <span className={styles.price}>Rs. {item.price.toLocaleString()}</span>
            <button
              disabled={!item.isAvailable}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              className={styles.cartBtn}
            >
              <img src={cartwhite} alt="" />
              Add
            </button>
          </div>
          {isAdmin && (
            <button
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item._id);
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MenuItemCardSkeleton: React.FC = () => (
  <div className={`${styles.card} ${styles.skeletonCard}`}>
    <div className={`${styles.imageWrapper} ${styles.skeletonBlock}`} />
    <div className={styles.content}>
      <div>
        <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonText}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonTextShort}`} />
      </div>
      <div className={styles.bottompart}>
        <div className={styles.bottom}>
          <div className={`${styles.skeletonLine} ${styles.skeletonPrice}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonBtn}`} />
        </div>
      </div>
    </div>
  </div>
);

const MenuSkeletonSection: React.FC<{ cardCount?: number }> = ({ cardCount = 4 }) => (
  <section className={styles.categorySection}>
    <div className={`${styles.skeletonLine} ${styles.skeletonCategoryTitle}`} />
    <div className={styles.grid}>
      {Array.from({ length: cardCount }).map((_, idx) => (
        <MenuItemCardSkeleton key={idx} />
      ))}
    </div>
  </section>
);

const MenuPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState<BakeryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [selectedItem, setSelectedItem] = useState<BakeryItem | null>(null);

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
    const storedUser = localStorage.getItem('qr_user');
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
  }, [id, fetchMenu, navigate]);

  const groupedItems = useMemo(() => {
    const grouped = menuItems.reduce((acc, item) => {
      const categoryName = item.category || 'Other';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(item);
      return acc;
    }, {} as Record<string, BakeryItem[]>);

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      items,
    }));
  }, [menuItems]);

  const buildCartLineId = (
    itemId: string,
    selectedAddOns: AddOnOption[],
    specialNotes: string
  ) => {
    const addOnKey = [...selectedAddOns]
      .map((addOn) => addOn.name)
      .sort()
      .join('|');
    return `${itemId}::${addOnKey}::${specialNotes.trim().toLowerCase()}`;
  };

  const addToCart = (
    item: BakeryItem,
    customization: CartCustomization = { quantity: 1, selectedAddOns: [], specialNotes: '' }
  ) => {
    try {
      const existingCart = localStorage.getItem('bakery_cart');
      const cart: CartItem[] = existingCart ? JSON.parse(existingCart) : [];

      const { quantity, selectedAddOns, specialNotes } = customization;
      const cartLineId = buildCartLineId(item._id, selectedAddOns, specialNotes);
      const unitPrice = item.price + selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);

      const existingLine = cart.find((line) => line.cartLineId === cartLineId);

      if (existingLine) {
        existingLine.quantity += quantity;
      } else {
        cart.push({
          ...item,
          cartLineId,
          quantity,
          unitPrice,
          selectedAddOns,
          specialNotes,
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

  const handleAddToCart = (item: BakeryItem) => {
    addToCart(item);
  };

  const handleAddToCartWithCustomization = (item: BakeryItem, customization: CartCustomization) => {
    addToCart(item, customization);
  };

  const handleDelete = async (itemId: string) => {
    const user = localStorage.getItem('qr_user');
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
      const token = localStorage.getItem('qr_accessToken');
      await axios.delete(`${API_ENDPOINTS.MENU_ACTION}/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { email: parsed.email, password },
      });

      toast.success('Item deleted');
      fetchMenu(false);
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerPart}>
              <h1>Our Menu</h1>
              <p>Freshly baked happiness every day</p>
            </div>
          </div>

          <MenuSkeletonSection cardCount={4} />
          <MenuSkeletonSection cardCount={3} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerPart}>
            <h1>Our Menu</h1>
            <p>Freshly baked happiness every day</p>
          </div>
          {isAdmin && (
            <button
              className={styles.adminBtn}
              onClick={() => navigate('/Menu/Add')}
            >
              + Add Item
            </button>
          )}
        </div>

        {groupedItems.map(({ category, items }) => {
          if (items.length === 0) return null;

          return (
            <section key={category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{category}</h2>
              <div className={styles.grid}>
                {items.map((item) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    isAdmin={isAdmin}
                    handleAddToCart={handleAddToCart}
                    handleDelete={handleDelete}
                    onClick={() => setSelectedItem(item)}
                  />
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
      </div>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCartWithCustomization}
        />
      )}
    </Layout>
  );
};

export default MenuPage;
