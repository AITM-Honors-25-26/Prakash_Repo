import React from 'react';
import styles from './ItemDetailModal.module.scss';

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

interface ItemDetailModalProps {
  item: BakeryItem;
  onClose: () => void;
  onAddToCart: (item: BakeryItem) => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, onAddToCart }) => {
  if (!item) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        <div className={styles.imageSection}>
            <img src={item.images?.[0]?.url || '/placeholder.jpg'} alt={item.name} />
        </div>

        <div className={styles.infoSection}>
            <div className={styles.textDetails}>
              <h2>{item.name}</h2>
              <p className={styles.price}>Rs. {item.price.toLocaleString()}</p>
              <div className={styles.divider}></div>
              <p className={styles.desc}>{item.description}</p>
            </div>
            
            <button 
              className={styles.addBtn} 
              disabled={!item.isAvailable}
              onClick={() => {
                onAddToCart(item);
                onClose(); 
              }}
            >
              {item.isAvailable ? 'Add to Cart' : 'Out of Stock'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default ItemDetailModal;