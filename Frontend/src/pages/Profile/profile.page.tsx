import React, { useState } from 'react';
import Layout from '../../components/layout/layout'; 
import styles from './profilePage.module.scss';
import defaultProfilePic from '../../../img/profile.png';

const Profile: React.FC = () => {
  const [userData] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  });
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
  return (
    <Layout>
      <div className={styles.pageContainer}>
        <div className={styles.profileCard}>
          <div className={styles.imageSection}>
            <img 
              src={userData.image?.url || defaultProfilePic} 
              alt="Profile" 
              className={styles.profileImage} 
            />
            <h2 className={styles.userName}>{userData.name}</h2>
            <p className={styles.userRole}>{userData.role}</p>
          </div>

          <div className={styles.infoSection}>
            <h3>Account Details</h3>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{userData.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Phone:</span>
              <span className={styles.value}>{userData.phone || 'Not provided'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Address:</span>
              <span className={styles.value}>{userData.address || 'Not provided'}</span>
            </div>
            <div className={styles.infoRow}>
                <span className={styles.label}>Date of Birth:</span>
                <span className={styles.value}>
                  {userData.dob 
                    ? new Date(userData.dob).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) 
                    : 'Not provided'}
                </span>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.editButton}>Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;