import React, { useState, useEffect } from 'react'; 
import { Link, useMatch } from 'react-router-dom';
import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

const Header: React.FC = () => {
  // 1. Check if the current route has a table parameter
  const menuMatch = useMatch("/MenuPage/:tableId");
  const urlTableId = menuMatch?.params.tableId;

  // 2. State to hold the active table across non-menu routes
  const [activeTable, setActiveTable] = useState<string | null>(() => {
    return urlTableId || localStorage.getItem('bakery_table');
  });

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

  // 3. Keep localStorage and activeTable state perfectly synced whenever a new QR code is scanned
  useEffect(() => {
    if (urlTableId) {
      localStorage.setItem('bakery_table', urlTableId);
      setActiveTable(urlTableId);
    } else {
      // Fallback to whatever was stored if navigating off the MenuPage
      const storedTable = localStorage.getItem('bakery_table');
      if (storedTable) {
        setActiveTable(storedTable);
      }
    }
  }, [urlTableId]);

  const hasStaffAccess = user && ['Admin', 'Chef', 'Waiter', 'Employee'].includes(user.role);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('bakery_table'); 
    setActiveTable(null);
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
        
        {/* Reactively builds menu path so they never lose their cart or context */}
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
        {/* If an active table session exists anywhere on the site, persist the badge */}
        {activeTable ? (
          <div className={styles.tableBadge}>
            <span>Table {activeTable}</span>
          </div>
        ) : user ? (
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
          <div className={styles.authButtons}>
            <Link to="/LoginPage" className={styles.loginLink}>Login</Link>
            <Link to="/RegisterPage" className={styles.signupBtn}>Register</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;