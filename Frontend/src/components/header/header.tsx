import React, { useState } from 'react'; 
import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

const Header: React.FC = () => {
  const [user, setUser] = useState<{ 
    fullName: string; 
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
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = "/LoginPage";
  };
  return (
    <header className={styles.header}>
        <a href="/">
          <img src={logowhite} className={styles.logo} alt="logo" />
        </a>
        <nav className={styles.navLinks}>
          <a href="/">Home</a>
          <a href="/MenuPage">Menu</a>
          <a href="/ContactUsPage">Contact Us</a>
          <a href="/AboutUsPage">About Us</a>
        </nav>
        <div className={styles.authSection}>
          {user ? (
            <div className={styles.profileWrapper}>
              <img 
                src={user.image?.url || profile} 
                className={styles.profile} 
                alt="Profile" 
              />
              <div className={styles.DropdownBar}>
                <div className={styles.userInfo}>
                  <p>{user.fullName}</p>
                </div>
                <hr />
                <div className={styles.actions}>
                  <a href="/settings">Settings</a>
                  <button className={styles.logoutBtn} onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <a href="/LoginPage" className={styles.loginLink}>Login</a>
              <a href="/RegisterPage" className={styles.signupBtn}>Register</a>
            </div>
          )}
        </div>
    </header>
  );
};
export default Header;