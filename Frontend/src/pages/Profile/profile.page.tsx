import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/layout/layout';
import styles from './profilePage.module.scss';
import defaultProfilePic from '../../../img/profile.png';
import { API_ENDPOINTS } from '../../constants/constants.js';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(() => {
    const savedUser = localStorage.getItem('qr_user');

    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!userData) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h2>Oops! You aren't logged in.</h2>
          <p>Please log in to view your profile.</p>
        </div>
      </Layout>
    );
  }

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
        // Notify other components (e.g. the header avatar) to refresh
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

  const formatDate = (date?: string) => {
    if (!date) return 'Not provided';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'Not provided';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const detailItems: { label: string; value: string }[] = [
    { label: 'Email', value: userData.email || 'Not provided' },
    { label: 'Phone', value: userData.phone || 'Not provided' },
    { label: 'Gender', value: userData.gender || 'Not provided' },
    { label: 'Date of Birth', value: formatDate(userData.dob) },
    { label: 'Address', value: userData.address || 'Not provided' },
    { label: 'Member Since', value: formatDate(userData.createdAt) },
  ];

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <div className={styles.profileCard}>
          <div className={styles.banner}>
            <div className={styles.avatarWrapper}>
              <img
                src={userData.image?.url || defaultProfilePic}
                alt="Profile"
                className={styles.profileImage}
              />
              <button
                type="button"
                className={styles.avatarOverlay}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Change photo"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className={styles.hiddenFileInput}
            />

            <h2 className={styles.userName}>
              {userData.name || userData.fullName || 'User'}
            </h2>
            <span className={styles.roleBadge}>{userData.role || 'Staff'}</span>
          </div>

          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>Account Details</h3>

            <div className={styles.detailsGrid}>
              {detailItems.map((item) => (
                <div className={styles.detailItem} key={item.label}>
                  <span className={styles.detailLabel}>{item.label}</span>
                  <span className={styles.detailValue}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => navigate('/SettingsPage')}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;