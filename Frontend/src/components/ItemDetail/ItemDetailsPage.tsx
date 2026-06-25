import React from 'react';
import styles from './ItemDetailModal.module.scss';

// Use the exact same BakeryItem interface from your MenuPage
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
    // The overlay background that covers the whole screen
    <div className={styles.modalOverlay} onClick={onClose}>
      
      {/* The actual popup box. e.stopPropagation() stops clicks inside the box from closing it */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>

        <div className={styles.imageContainer}>
            <img src={item.images?.[0]?.url || '/placeholder.jpg'} alt={item.name} />
        </div>

        <div className={styles.detailsContainer}>
            <h2>{item.name}</h2>
            <p className={styles.price}>Rs. {item.price.toLocaleString()}</p>
            <p className={styles.desc}>{item.description}</p>
            
            <button 
              className={styles.addBtn} 
              disabled={!item.isAvailable}
              onClick={() => {
                onAddToCart(item);
                onClose(); // Automatically close the modal after adding to cart
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