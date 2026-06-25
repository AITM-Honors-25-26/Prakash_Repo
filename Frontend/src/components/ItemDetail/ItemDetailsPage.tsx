import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../../constants/constants';
import Layout from '../../components/layout/layout';
import styles from './ItemDetailPage.module.scss';

// Define a proper interface for your menu item
interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string; public_id: string }[];
}

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const { data } = await axios.get(`${API_ENDPOINTS.GET_MENU_ITEM}/${id}`);
        setItem(data.data); 
      } catch  {
        toast.error("Failed to load item details");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) return <div className={styles.loader}>Loading...</div>;
  if (!item) return <div className={styles.notFound}>Item not found</div>;

  return (
    <Layout>
      <div className={styles.detailContainer}>
        {/* Use optional chaining to prevent crashes */}
        <img 
          src={item.images?.[0]?.url || '/default-bakery-item.png'} 
          alt={item.name} 
        />
        <h1>{item.name}</h1>
        <p className={styles.price}>Rs. {item.price.toLocaleString()}</p>
        <p className={styles.desc}>{item.description}</p>
        
        <button 
          className={styles.addBtn}
          onClick={() => {
            // Placeholder: Add your add-to-cart logic here
            toast.success(`${item.name} added to cart!`);
          }}
        >
          Add to Cart
        </button>
      </div>
    </Layout>
  );
};

export default ItemDetailPage;