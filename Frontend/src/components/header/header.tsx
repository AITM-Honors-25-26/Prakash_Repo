import React from 'react';
import styles from './header.module.scss';
import profile from './../../../img/profile.png'

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Testing Navbar</div>
      <nav className={styles.navLinks}>
        <a href="/">Home</a>
        <a href="/features">Special</a>
        <a href="/contact">About Us</a>
      </nav>
      <div><img src={profile} className={styles.logo} alt="Profile" /></div>
    </header>
  );
};

export default Header;       