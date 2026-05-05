import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; 
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styles from './MenuPage.module.scss';
import Layout from '../../components/layout/layout';
import cartwhite from '../../../img/icons/cart.white.png';
import { API_ENDPOINTS } from '../../constants/constants';

import hot from '../../../img/gif/hot.gif'

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
  }, [fetchMenu]);

  // 2. Add Item Function (Handles File Upload + Form Data)
  const handleAddItem = async () => {
    // Step A: Pick the File
    const { value: file } = await MySwal.fire({
      title: 'Select Item Image',
      input: 'file',
      inputAttributes: {
        'accept': 'image/*',
        'aria-label': 'Upload bakery item image'
      },
      confirmButtonColor: '#d84315',
      showCancelButton: true
    });

    if (!file) return;

    // Step B: Fill the Details
    const { value: formValues } = await MySwal.fire({
      title: 'Item Details',
      background: '#faf7f2',
      color: '#2d1b18',
      html:
        '<input id="swal-name" class="swal2-input" placeholder="Item Name">' +
        '<input id="swal-desc" class="swal2-input" placeholder="Description">' +
        '<input id="swal-price" type="number" class="swal2-input" placeholder="Price (Rs.)">' +
        '<input id="swal-stock" type="number" class="swal2-input" placeholder="Stock Quantity" value="1">' +
        '<select id="swal-category" class="swal2-input">' +
          '<option value="Bread">Bread</option>' +
          '<option value="Cake">Cake</option>' +
        '</select>',
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
      } catch (error: unknown) {
        let errorMsg = "Failed to add item.";
        if (axios.isAxiosError(error)) {
          errorMsg = error.response?.data?.message || errorMsg;
        }
        toast.error(errorMsg);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      toast.error("You must be logged in to perform this action.");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    const userEmail = userData.email;

    const { value: password } = await MySwal.fire({
      title: 'Security Verification',
      text: `Enter the password for ${userEmail} to delete this item.`,
      input: 'password',
      inputPlaceholder: 'Enter your password',
      showCancelButton: true,
      confirmButtonText: 'Delete Item',
      confirmButtonColor: '#d84315',
      cancelButtonColor: '#2d1b18',
      background: '#faf7f2',
      color: '#2d1b18',
      icon: 'warning',
      iconColor: '#d84315',
    });

    if (password) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_ENDPOINTS.MENU_ACTION}/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          data: { password: password, email: userEmail } 
        });
        
        toast.success("The item has been removed from the menu.");
        await fetchMenu(false); 
      } catch (error: unknown) {
        let errorMsg = "Incorrect password or delete failed.";
        if (axios.isAxiosError(error)) {
          errorMsg = error.response?.data?.message || errorMsg;
        }
        toast.error(errorMsg);
      }
    }
  };

  const renderCategorySection = (title: string, categoryName: string) => {
    const filteredItems = menuItems.filter(item => item.category === categoryName);

    if (filteredItems.length === 0) return null;

    return (
      <section className={styles.categoryWrap} key={categoryName}>
        <div className={styles.topic}>
          <h1>{title}</h1>
        </div>
        <div className={styles.itemSection}>
          {filteredItems.map((item) => (
            <div key={item._id} className={styles.photosection}>
              <img
                src={item.images?.[0]?.url || 'https://via.placeholder.com/400x500?text=Bakery+Item'} 
                alt={item.name} 
              />
              <div className={styles.overlay}>
                <h3>{item.name}</h3>
                <p className={styles.itemDescription}>{item.description}</p>
                <p className={styles.itemPrice}>
                  Rs. {Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                
                <button className={styles.buttonDiv}>
                  Add to cart <img src={cartwhite} alt="Cart" />
                </button>

                {isAdmin && (
                  <button 
                    className={styles.deleteButton} 
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
  };

  return (
    <Layout>
      <div className={styles.main}>
        {/* Admin Header: Add Button */}
        {isAdmin && (
          <div className={styles.adminHeader} style={{ textAlign: 'center', marginBottom: '20px' }}>
             <button 
               className={styles.addBtn} 
               onClick={handleAddItem}
               style={{ 
                 backgroundColor: '#d84315', 
                 color: 'white', 
                 padding: '12px 25px', 
                 borderRadius: '8px', 
                 border: 'none', 
                 fontWeight: 'bold',
                 cursor: 'pointer' 
               }}
             >
               + Add New Bakery Item
             </button>
          </div>
        )}

        {loading ? (
          <div className={styles.topic}>
            <h1>Baking your menu...</h1>
          </div>
        ) : (
          <>
            {renderCategorySection("Fresh Breads", "Bread")}
            {renderCategorySection("Signature Cakes", "Cake")}
            
            {!loading && menuItems.length === 0 && (
              <div className={styles.noItems}>
                <img src={hot} alt="" />
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