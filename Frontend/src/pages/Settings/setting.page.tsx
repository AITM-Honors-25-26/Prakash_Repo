import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/layout/layout';
import styles from './settingPage.module.scss';
import defaultProfile from '../../../img/gif/profile.gif';
import { API_ENDPOINTS } from '../../constants/constants.js';

const Settings: React.FC = () => {
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('qr_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [formData, setFormData] = useState({
    fullName: userData?.fullName || userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    gender: userData?.gender || '',
    role: userData?.role || '',
    dob: userData?.dob
      ? new Date(userData.dob).toISOString().split('T')[0]
      : '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('qr_accessToken');
    if (!token) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const response = await axios.patch(API_ENDPOINTS.PROFILE_PHOTO, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = response.data?.data?.user;
      if (updatedUser) {
        const updatedData = { ...userData, image: updatedUser.image };
        setUserData(updatedData);
        localStorage.setItem('qr_user', JSON.stringify(updatedData));
        window.dispatchEvent(new Event('qr_user_updated'));
        toast.success('Profile photo updated successfully!');
      }
    } catch (error: unknown) {
      console.error('Profile photo update error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update profile photo.');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      ...userData,
      ...formData,
      name: formData.fullName,
      fullName: formData.fullName,
    };

    localStorage.setItem('qr_user', JSON.stringify(updatedUser));
    setUserData(updatedUser);
    window.dispatchEvent(new Event('qr_user_updated'));
    toast.success('Profile Updated Successfully');
  };

  const handleLogout = () => {
    localStorage.removeItem('qr_accessToken');
    localStorage.removeItem('qr_refreshToken');
    localStorage.removeItem('qr_user');
    localStorage.removeItem('bakery_table');
    window.location.href = "/";
  };

  if (!userData) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h2>Please Login First</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <div className={styles.headerSection}>
          <p className={styles.pageTitle}>
            Account Settings
          </p>
          <p>
            Manage your profile information and account preferences
          </p>
        </div>
        <section className={styles.settingsCard}>
          <div className={styles.profileTop}>
            <div className={styles.imageSection}>
              <img
                src={
                  userData?.image?.url || defaultProfile
                }
                alt="profile"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className={styles.hiddenFileInput}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Change Photo'}
              </button>
            </div>
            <div className={styles.userInfo}>
              <h2>{userData.name || userData.fullName}</h2>
              <span>{userData.role}</span>
              <p>{userData.email}</p>
            </div>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className={styles.form}
          >
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.inputGroup}>
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Role</label>
                <input
                  type="text"
                  value={formData.role}
                  disabled
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className={styles.saveBtn}
            >
              Save Changes
            </button>
          </form>
        </section>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </Layout>
  );
};

export default Settings;