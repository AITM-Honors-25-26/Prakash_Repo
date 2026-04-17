import React, { useState } from 'react';
import Layout from '../../components/layout/layout';
import styles from './settingPage.module.scss';

const Settings: React.FC = () => {
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [formData, setFormData] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    dob: userData?.dob ? userData.dob.split('T')[0] : '', 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    

    const updatedUser = { ...userData, ...formData };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUserData(updatedUser);
    
    alert('Profile updated successfully!');
  };

  if (!userData) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h2>Please log in to view settings.</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <div className={styles.settingsWrapper}>
          <h1 className={styles.pageTitle}>Account Settings</h1>
          <section className={styles.settingsCard}>
            <h2>Edit Profile Information</h2>
            <form onSubmit={handleSaveProfile} className={styles.form}>
              
              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Delivery Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
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

              <button type="submit" className={styles.saveBtn}>Save Changes</button>
            </form>
          </section>
          <section className={styles.settingsCard}>
            <h2>Change Password</h2>
            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); alert("Password feature coming soon!"); }}>
              <div className={styles.inputGroup}>
                <label>Current Password</label>
                <input type="password" placeholder="Enter current password" />
              </div>
              <div className={styles.inputGroup}>
                <label>New Password</label>
                <input type="password" placeholder="Enter new password" />
              </div>
              <button type="submit" className={styles.passwordBtn}>Update Password</button>
            </form>
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default Settings;