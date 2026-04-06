import React from 'react';
import styles from './header.module.scss';
import profile from './../../../img/profile.png'
import logo from './../../../img/Logo.png'

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div><img src={logo} className={styles.logo} alt="logo" /></div>
      <nav className={styles.navLinks}>
        <a href="/">Home</a>
        <a href="/features">Special</a>
        <a href="/contact">About Us</a>
      </nav>
      <div><img src={profile} className={styles.profile} alt="Profile" /></div>
    </header>
  );
};

export default Header;       