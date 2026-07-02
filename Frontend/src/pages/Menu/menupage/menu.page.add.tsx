import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import styles from './menu.page.add.module.scss';
import Layout from '../../../components/layout/layout';
import { API_ENDPOINTS } from '../../../constants/constants';

const MySwal = withReactContent(Swal);

const CATEGORIES = ['Cake', 'Bread', 'Pastries', 'Cookies', 'Cupcake','Donuts', 'Beverage', 'Special'];

interface ImagePreview {
  file: File;
  previewUrl: string;
}

const CreateMenuItemPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('qr_user');
    if (!storedUser) {
      toast.error('Access denied');
      navigate('/menu', { replace: true });
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== 'Admin') {
        toast.error('Access denied');
        navigate('/menu', { replace: true });
      }
    } catch {
      navigate('/menu', { replace: true });
    }
  }, [navigate]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    isAvailable: true,
  });

  const [images, setImages] = useState<ImagePreview[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 4) {
      toast.warning('Maximum 4 images allowed');
      return;
    }
    const newPreviews: ImagePreview[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.description || !form.price || !form.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    const storedUser = localStorage.getItem('qr_user');
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);

    const { value: password } = await MySwal.fire({
      title: 'Admin Verification',
      text: 'Enter your password to add this item to the menu.',
      input: 'password',
      inputPlaceholder: 'Enter password',
      showCancelButton: true,
      confirmButtonColor: '#ff6b35', 
    });

    if (!password) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('qr_accessToken');
      const formData = new FormData();

      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('stock', form.stock || '0');
      formData.append('isAvailable', String(form.isAvailable));
      images.forEach((img) => formData.append('images', img.file));
      
      formData.append('email', parsedUser.email);
      formData.append('password', password);

      await axios.post(API_ENDPOINTS.ADDMENUITEM, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(`"${form.name}" added to the menu!`);
      navigate('/MenuPage');
    } catch (error: unknown) {
      console.error(error);
      
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to create item');
      } 
      else if (error instanceof Error) {
        toast.error(error.message);
      } 
      else {
        toast.error('An unexpected error occurred');
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div>
            <h1>Add Menu Item</h1>
            <p>Fill in the details below to add a new item to the menu</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.leftCol}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Product Images</h2>
              <p className={styles.cardSub}>Upload up to 4 images</p>

              <div className={styles.imageGrid}>
                {images.map((img, i) => (
                  <div key={i} className={styles.imageThumb}>
                    <img src={img.previewUrl} alt={`preview-${i}`} />
                    <button
                      type="button"
                      className={styles.removeImg}
                      onClick={() => removeImage(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {images.length < 4 && (
                  <label className={styles.uploadBox}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      hidden
                    />
                    <span className={styles.uploadIcon}>＋</span>
                    <span>Add Photo</span>
                  </label>
                )}
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Status</h2>

              <div className={styles.field}>
                <label>Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  className={styles.input}
                />
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <p className={styles.toggleLabel}>Available for Order</p>
                  <p className={styles.toggleSub}>
                    Customers can add this to their cart
                  </p>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={form.isAvailable}
                    onChange={handleChange}
                  />
                  <span className={styles.slider} />
                </label>
              </div>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Item Details</h2>

              <div className={styles.field}>
                <label>
                  Item Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Chocolate Fudge Cake"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>
                  Description <span className={styles.required}>*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the item — ingredients, flavour, size..."
                  className={styles.textarea}
                  rows={4}
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>
                    Price (Rs.) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="e.g. 450"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label>
                    Category <span className={styles.required}>*</span>
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                '＋ Add to Menu'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateMenuItemPage;