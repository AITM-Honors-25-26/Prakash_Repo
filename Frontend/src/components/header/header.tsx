import React from 'react';
import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

const Header: React.FC = () => {
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
        <div className={styles.profileWrapper}>
          <img src={profile} className={styles.profile} alt="Profile" />
          <div className={styles.DropdownBar}>
            <div className={styles.userInfo}>
              <p>this is where name will appear</p>
            </div>
            <p>Profile</p>
            <hr />
            <div className={styles.actions}>
              <a href="/settings">Settings</a>
            <hr />
            <button className={styles.logoutBtn}>Logout</button>
          </div>
          </div>
        </div>
    </header>
  );
};
export default Header;