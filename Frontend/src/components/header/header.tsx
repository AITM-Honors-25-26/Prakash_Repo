import React, { useState } from 'react'; 
import { Link, useMatch } from 'react-router-dom';
import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

const Header: React.FC = () => {
  // 1. Get the current table from the URL route parameter
  const menuMatch = useMatch("/MenuPage/:tableId");
  const urlTableId = menuMatch?.params.tableId;

  // 2. If a fresh ID is parsed out of the URL, save it immediately during render.
  // This completely eliminates the need for an asynchronous useEffect state sync loop.
  if (urlTableId) {
    localStorage.setItem('bakery_table', urlTableId);
  }

  // 3. Fallback safely to whatever is stored if the user moves to Home/About/Contact
  const activeTable = urlTableId || localStorage.getItem('bakery_table');

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
        
        {/* Dynamic menu string interpolation based on active session */}
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
        {/* The badge renders smoothly as activeTable evaluates line-by-line */}
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