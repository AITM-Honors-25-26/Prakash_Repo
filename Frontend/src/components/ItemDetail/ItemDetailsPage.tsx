import React, { useMemo, useState } from 'react';
import styles from './ItemDetailModal.module.scss';

export interface AddOnOption {
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

export interface CartCustomization {
  quantity: number;
  selectedAddOns: AddOnOption[];
  specialNotes: string;
}

interface ItemDetailModalProps {
  item: BakeryItem;
  onClose: () => void;
  onAddToCart: (item: BakeryItem, customization: CartCustomization) => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOnNames, setSelectedAddOnNames] = useState<Set<string>>(new Set());
  const [specialNotes, setSpecialNotes] = useState('');

  const addOns = useMemo(() => item?.addOns ?? [], [item]);

  const selectedAddOns = useMemo(
    () => addOns.filter((addOn) => selectedAddOnNames.has(addOn.name)),
    [addOns, selectedAddOnNames]
  );

  if (!item) return null;

  const toggleAddOn = (name: string) => {
    setSelectedAddOnNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const unitPrice = item.price + addOnsTotal;
  const lineTotal = unitPrice * quantity;

  const handleAdd = () => {
    onAddToCart(item, {
      quantity,
      selectedAddOns,
      specialNotes: specialNotes.trim(),
    });
    onClose();
  };

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

              <div className={styles.customizeBlock}>
                <label className={styles.customizeLabel}>Quantity</label>
                <div className={styles.quantityStepper}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => Math.min(20, q + 1))}>
                    +
                  </button>
                </div>
              </div>

              {addOns.length > 0 && (
                <div className={styles.customizeBlock}>
                  <label className={styles.customizeLabel}>Add-ons (optional)</label>
                  <div className={styles.addOnsList}>
                    {addOns.map((addOn) => (
                      <label key={addOn.name} className={styles.addOnRow}>
                        <span className={styles.addOnCheck}>
                          <input
                            type="checkbox"
                            checked={selectedAddOnNames.has(addOn.name)}
                            onChange={() => toggleAddOn(addOn.name)}
                          />
                          {addOn.name}
                        </span>
                        <span className={styles.addOnPrice}>+ Rs. {addOn.price.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.customizeBlock}>
                <label className={styles.customizeLabel} htmlFor="special-notes">
                  Special Instructions (optional)
                </label>
                <textarea
                  id="special-notes"
                  className={styles.notesInput}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. no onions, extra spicy, less sugar..."
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>

            <div className={styles.footerSection}>
              <div className={styles.lineTotal}>
                <span>Item Total</span>
                <strong>Rs. {lineTotal.toLocaleString()}</strong>
              </div>
              <button
                className={styles.addBtn}
                disabled={!item.isAvailable}
                onClick={handleAdd}
              >
                {item.isAvailable ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ItemDetailModal;
