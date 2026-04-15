import React, { useState } from 'react'; 
import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

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
          {isLoggedIn ? (

            <div className={styles.profileWrapper}>
              <img src={profile} className={styles.profile} alt="Profile" />
              <div className={styles.DropdownBar}>
                <div className={styles.userInfo}>
                  <p>Prakash Dahal</p>
                </div>
                <hr />
                <div className={styles.actions}>
                  <a href="/settings">Settings</a>
                  <button className={styles.logoutBtn} onClick={() => setIsLoggedIn(false)}>
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