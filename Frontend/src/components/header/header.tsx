import React, { useState, useEffect } from 'react'; 
import { Link, useMatch, useNavigate } from 'react-router-dom';
import axios from 'axios'; 

import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

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

      const handleTableNotFound = () => {
        localStorage.removeItem('bakery_table');
        setActiveTable(null);
        navigate('/ErrorPage', { 
          state: { 
            title: "Table Not Found", 
            message: `Table ${urlTableId} is not recognized. Please scan a valid QR code at your table.` 
          },
          replace: true 
        });
      };

      try {
        const response = await axios.get(API_ENDPOINTS.LISTALLTABLE);
        const data = response.data?.data || response.data?.result || response.data;
        
        if (Array.isArray(data)) {
          const tableInDB = data.find((t: RestaurantTable) => String(t.tableNumber) === String(urlTableId));
          
          if (!tableInDB) {
            handleTableNotFound();
          } 
          else if (tableInDB.status !== 'Available') {
            localStorage.removeItem('bakery_table');
            setActiveTable(null);
            navigate('/ErrorPage', { 
              state: { 
                title: "Table Unavailable", 
                message: `Table ${urlTableId} is currently marked as ${tableInDB.status}. You cannot order from this table.` 
              },
              replace: true 
            });
          } 
          else {
            localStorage.setItem('bakery_table', urlTableId);
            setActiveTable(urlTableId);
          }
        }
      } catch (error) {
        console.error("Failed to verify table status", error);
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
        
        {/* Dashboard link for Kitchen and Staff */}
        {hasStaffAccess && (
          <Link to="/DashboardPage" className={styles.staffLink}>
            Dashboard
          </Link>
        )}

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