import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; 
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useParams } from 'react-router-dom'; // <-- ADDED: For grabbing table ID from URL
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

const MenuPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // <-- ADDED: Extract the table ID parameter
  const [menuItems, setMenuItems] = useState<BakeryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // 1. Fetch Menu
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
      console.error("Fetch Error:", error);
      toast.error("Failed to load menu items.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ADDED: Monitor QR Code URL parameter updates and lock the table configuration
  useEffect(() => {
    if (id) {
      localStorage.setItem('bakery_table', id);
      toast.success(`Welcome! Orders will be served to Table: ${id}`, {
        autoClose: 4000
      });
    }
  }, [id]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user'); 
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAdmin(userData.role === 'Admin');
      } catch (e) {
        console.error("Parsing Error", e);
      }
    }
    fetchMenu();
    const interval = setInterval(() => {
      fetchMenu(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMenu]);

  const handleAddItem = async () => {
    const { value: file } = await MySwal.fire({
      title: 'Select Item Image',
      input: 'file',
      inputAttributes: { 'accept': 'image/*', 'aria-label': 'Upload bakery item image' },
      confirmButtonColor: '#d84315',
      showCancelButton: true
    });

    if (!file) return;

    const categoryOptions = Object.values(CATAGOTY)
      .map(cat => `<option value="${cat}">${cat}</option>`)
      .join('');

    const { value: formValues } = await MySwal.fire({
      title: 'Item Details',
      background: '#faf7f2',
      color: '#2d1b18',
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Item Name">
        <input id="swal-desc" class="swal2-input" placeholder="Description">
        <input id="swal-price" type="number" class="swal2-input" placeholder="Price (Rs.)">
        <input id="swal-stock" type="number" class="swal2-input" placeholder="Stock Quantity" value="1">
        <select id="swal-category" class="swal2-input">
          ${categoryOptions}
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Add to Menu',
      confirmButtonColor: '#d84315',
      cancelButtonColor: '#2d1b18',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const price = (document.getElementById('swal-price') as HTMLInputElement).value;
        if (!name || !price) {
          Swal.showValidationMessage('Name and Price are required');
          return false;
        }
        return { 
          name, 
          description: (document.getElementById('swal-desc') as HTMLInputElement).value, 
          price, 
          stock: (document.getElementById('swal-stock') as HTMLInputElement).value,
          category: (document.getElementById('swal-category') as HTMLSelectElement).value, 
        };
      }
    });

    if (formValues) {
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('image', file); 
        formData.append('name', formValues.name);
        formData.append('description', formValues.description);
        formData.append('price', formValues.price);
        formData.append('stock', formValues.stock);
        formData.append('category', formValues.category);
        formData.append('isAvailable', 'true');

        await axios.post(API_ENDPOINTS.MENU_ACTION, formData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
          }
        });
        
        toast.success(`${formValues.name} added successfully!`);
        await fetchMenu(false); 
      } catch  {
        toast.error("Failed to add item.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    
    const userData = JSON.parse(storedUser);
    const userEmail = userData.email;

    const { value: password } = await MySwal.fire({
      title: 'Security Verification',
      text: `Enter password for ${userEmail}`,
      input: 'password',
      showCancelButton: true,
      confirmButtonColor: '#d84315',
    });

    if (password) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_ENDPOINTS.MENU_ACTION}/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          data: { password: password, email: userEmail } 
        });
        toast.success("Item removed.");
        await fetchMenu(false); 
      } catch  {
        toast.error("Delete failed.");
      }
    }
  };

  // 2. Handle Add to Cart
  const handleAddToCart = (item: BakeryItem) => {
    try {
      const existingCart = localStorage.getItem('bakery_cart');
      const cart = existingCart ? JSON.parse(existingCart) : [];

      const existingItemIndex = cart.findIndex((cartItem: BakeryItem) => cartItem._id === item._id);

      if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += 1;
      } else {
        cart.push({ ...item, quantity: 1 });
      }

      localStorage.setItem('bakery_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success(`${item.name} added to cart!`);
    } catch (error) {
      console.error("Cart Error:", error);
      toast.error("Failed to add item to cart.");
    }
  };

  const renderCategorySection = (categoryName: string) => {
    const filteredItems = menuItems.filter(item => item.category === categoryName);
    if (filteredItems.length === 0) return null;

    return (
      <section className={styles.categoryWrap} key={categoryName}>
        <div className={styles.topic}>
          <h1>{categoryName}s</h1>
        </div>
        <div className={styles.itemSection}>
          {filteredItems.map((item) => (
            <div key={item._id} className={styles.photosection}>
              <img src={item.images?.[0]?.url || 'https://via.placeholder.com/400x500'} alt={item.name} />
              <div className={styles.overlay}>
                <h3>{item.name}</h3>
                <p className={styles.itemDescription}>{item.description}</p>
                <p className={styles.itemPrice}>Rs. {Number(item.price).toLocaleString()}</p>
                
                {/* Updated Button Here */}
                <button 
                  className={styles.buttonDiv} 
                  onClick={() => handleAddToCart(item)}
                >
                  Add to cart <img src={cartwhite} alt="Cart" />
                </button>

                {isAdmin && (
                  <button className={styles.deleteButton} onClick={() => handleDelete(item._id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <Layout>
      <div className={styles.main}>
        {isAdmin && (
          <div className={styles.adminHeader} style={{ textAlign: 'center', marginBottom: '20px' }}>
             <button className={styles.addBtn} onClick={handleAddItem}>
               + Add New {CATAGOTY.CAKE} or Item
             </button>
          </div>
        )}

        {loading ? (
          <div className={styles.topic}><h1>Baking your menu...</h1></div>
        ) : (
          <>
            {/* Dynamically render all categories defined in your constants */}
            {Object.values(CATAGOTY).map(cat => renderCategorySection(cat))}
            
            {menuItems.length === 0 && (
              <div className={styles.noItems}>
                <img src={hot} alt="Empty" />
                <p>Our oven is resting. No items found today.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default MenuPage;