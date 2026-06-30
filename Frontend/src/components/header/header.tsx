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

  const [menuOpen, setMenuOpen] = useState(false);

  const [user, setUser] = useState<{ 
    name: string; 
    role: string; 
    image?: { url: string }
  } | null>(() => {
    const savedUser = localStorage.getItem('qr_user');
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

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [urlTableId]);

  const hasStaffAccess = user && ['Admin', 'Chef', 'Waiter', 'Employee'].includes(user.role);

  const handleLogout = () => {
    localStorage.removeItem('qr_accessToken');
    localStorage.removeItem('qr_refreshToken');
    localStorage.removeItem('qr_user');
    localStorage.removeItem('bakery_table'); 
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logoLink} onClick={() => setMenuOpen(false)}>
        <img src={logowhite} className={styles.logo} alt="logo" />
      </Link>

      <button
        className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
        onClick={() => setMenuOpen(prev => !prev)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>

        <Link
          to={activeTable ? `/MenuPage/${activeTable}` : "/MenuPage"}
          onClick={() => setMenuOpen(false)}
        >
          Menu {activeTable && `(Table ${activeTable})`}
        </Link>

        {hasStaffAccess && (
          <Link to="/DashboardPage" className={styles.staffLink} onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
        )}

        {hasStaffAccess && (
          <Link to="/TableManagement" className={styles.staffLink} onClick={() => setMenuOpen(false)}>
            Tables
          </Link>
        )}

        <Link to="/ContactUsPage" onClick={() => setMenuOpen(false)}>Contact Us</Link>
        <Link to="/AboutUsPage" onClick={() => setMenuOpen(false)}>About Us</Link>

        {/* Auth section duplicated here for mobile drawer */}
        <div className={styles.mobileAuthSection}>
          {!user && activeTable && (
            <div className={styles.tableBadge}>
              <span>Table {activeTable}</span>
            </div>
          )}

          {!user && !activeTable && (
            <div className={styles.authButtons}>
              <Link to="/LoginPage" className={styles.loginLink} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/RegisterPage" className={styles.signupBtn} onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          )}

          {user && (
            <div className={styles.mobileUserInfo}>
              <img src={user.image?.url || profile} className={styles.profileMobile} alt="Profile" />
              <div>
                <p>{user.name}</p>
                <small>{user.role}</small>
              </div>
            </div>
          )}

          {user && (
            <div className={styles.actions}>
              <Link to="/ProfilePage" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link to="/SettingsPage" onClick={() => setMenuOpen(false)}>Settings</Link>
              <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}

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