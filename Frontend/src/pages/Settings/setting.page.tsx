import React, { useState } from 'react';
import Layout from '../../components/layout/layout';
import styles from './settingPage.module.scss';
import defaultProfile from '../../../img/gif/profile.gif'

const Settings: React.FC = () => {
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [formData, setFormData] = useState({
    fullName: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    gender: userData?.gender || '',
    role: userData?.role || '',
    dob: userData?.dob
      ? new Date(userData.dob).toISOString().split('T')[0]
      : '',
  });
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
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUserData(updatedUser);
    alert('Profile Updated Successfully');
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
                  userData?.image?.url || {defaultProfile}
                }
                alt="profile"
              />
              <button>
                Change Photo
              </button>
            </div>
            <div className={styles.userInfo}>
              <h2>{userData.name}</h2>
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
          <button className={styles.logoutBtn}>
            Logout
          </button>
      </div>
    </Layout>
  );
};

export default Settings;