import React, { useState, useEffect } from 'react'; 
import { Link, useMatch, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 
import axios from 'axios'; 

import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

// Ensure this path is correct relative to your Header component
import { API_ENDPOINTS } from '../../constants/constants.js'; 

// 1. Define the interface here to fix the "any" type error safely
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

  // State for active table
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

  // 2. Validate the table whenever the URL changes
  useEffect(() => {
    const verifyTable = async () => {
      if (urlTableId) {
        try {
          // Fetch all tables from the backend
          const response = await axios.get(API_ENDPOINTS.LISTALLTABLE);
          const data = response.data?.data || response.data?.result || response.data;
          
          if (Array.isArray(data)) {
            // FIX: Using the RestaurantTable type instead of 'any'
            const validTable = data.find((t: RestaurantTable) => String(t.tableNumber) === String(urlTableId));
            
            // NOTE: If you strictly want to ensure the table status is "Available" before they can view the menu, 
            // you can change the condition below to: if (validTable && validTable.status === 'Available')
            
            if (validTable) {
              // Table exists in the backend -> Save it
              localStorage.setItem('bakery_table', urlTableId);
              setActiveTable(urlTableId);
            } else {
              // Table does NOT exist -> Show toast and clear invalid data
              toast.error(`Table ${urlTableId} is not valid or currently unavailable.`);
              localStorage.removeItem('bakery_table');
              setActiveTable(null);
              
              // Redirect them to the general menu page
              navigate('/MenuPage', { replace: true });
            }
          }
        } catch (error) {
          console.error("Failed to verify table status", error);
          toast.error("Could not verify table network. Please try again.");
        }
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