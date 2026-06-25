import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../../constants/constants';
import Layout from '../../components/layout/layout';
import styles from './ItemDetailPage.module.scss';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const { data } = await axios.get(`${API_ENDPOINTS.GET_MENU_ITEM}/${id}`);
        setItem(data.data);
      } catch (err) {
        toast.error("Failed to load item details");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Item not found</div>;

  return (
    <Layout>
      <div className={styles.detailContainer}>
        <img src={item.images[0].url} alt={item.name} />
        <h1>{item.name}</h1>
        <p className={styles.price}>Rs. {item.price}</p>
        <p className={styles.desc}>{item.description}</p>
        <button className={styles.addBtn}>Add to Cart</button>
      </div>
    </Layout>
  );
};

export default ItemDetailPage;