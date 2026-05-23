import React, { useState, useEffect } from 'react'; 
import { Link, useMatch, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 
import axios from 'axios'; 

import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

// Ensure this path is correct relative to your Header component
import { API_ENDPOINTS } from '../../constants/constants.js'; 

export interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'NotAvailable';
  location: 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const menuMatch = useMatch("/MenuPage/:tableId");
  const urlTableId = menuMatch?.params.tableId;

  const [activeTable, setActiveTable] = useState<string | null>(
    localStorage.getItem('bakery_table')
  );

  const [user, setUser] = useState<{ 
    name: string; 
    role: string; 
    image?: { url: string }
  } | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Error parsing user data", e);
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const verifyTable = async () => {
      if (!urlTableId) return;

      // REUSABLE HELPER: Triggers if the table isn't found OR if the server throws an error
      const handleTableNotFound = () => {
        toast.error(`Table ${urlTableId} is not available in the database. Please scan a valid QR code.`);
        localStorage.removeItem('bakery_table');
        setActiveTable(null);
        navigate('/MenuPage', { replace: true });
      };

      try {
        const response = await axios.get(API_ENDPOINTS.LISTALLTABLE);
        const data = response.data?.data || response.data?.result || response.data;
        
        if (Array.isArray(data)) {
          const validTable = data.find((t: RestaurantTable) => String(t.tableNumber) === String(urlTableId));
          
          if (validTable) {
            // Table exists in the backend -> Save it
            localStorage.setItem('bakery_table', urlTableId);
            setActiveTable(urlTableId);
          } else {
            // Table NOT found in the database array
            handleTableNotFound();
          }
        }
      } catch (error) {
        console.error("Failed to verify table status", error);
        // AXIOS FIX: If the database throws a 404 because the table doesn't exist, we catch it here.
        handleTableNotFound();
      }
    };

    verifyTable();
  }, [urlTableId, navigate]); 

  const hasStaffAccess = user && ['Admin', 'Chef', 'Waiter', 'Employee'].includes(user.role);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('bakery_table'); 
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className={styles.header}>
      <Link to="/">
        <img src={logowhite} className={styles.logo} alt="logo" />
      </Link>
      
      <nav className={styles.navLinks}>
        <Link to="/">Home</Link>
        
        <Link to={activeTable ? `/MenuPage/${activeTable}` : "/MenuPage"}>
          Menu {activeTable && `(Table ${activeTable})`}
        </Link>
        
        {hasStaffAccess && (
          <Link to="/TableManagement" className={styles.staffLink}>
            Tables
          </Link>
        )}

        <Link to="/ContactUsPage">Contact Us</Link>
        <Link to="/AboutUsPage">About Us</Link>
      </nav>

      <div className={styles.authSection}>
        {!user && activeTable && (
          <div className={styles.tableBadge}>
            <span>Table {activeTable}</span>
          </div>
        )}

        {user ? (
          <div className={styles.profileWrapper}>
            <img 
              src={user.image?.url || profile} 
              className={styles.profile} 
              alt="Profile" 
            />
            <div className={styles.DropdownBar}>
              <div className={styles.userInfo}>
                <p>{user.name}</p>
                <small className={styles.userRole}>{user.role}</small>
              </div>
              <hr />
              <div className={styles.actions}>
                <Link to="/ProfilePage">Profile</Link>
                <hr />
                <Link to="/SettingsPage">Settings</Link>
                <hr />
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          !activeTable && (
            <div className={styles.authButtons}>
              <Link to="/LoginPage" className={styles.loginLink}>Login</Link>
              <Link to="/RegisterPage" className={styles.signupBtn}>Register</Link>
            </div>
          )
        )}
      </div>
    </header>
  );
};

export default Header;