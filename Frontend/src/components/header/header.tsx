import React from 'react';
import styles from './header.module.scss';
import profile from './../../../img/profile.png'
import logo from './../../../img/Logo.png'

const Header: React.FC = () => {
  return (

    <header className={styles.header}>
      
        <img src={logo} className={styles.logo} alt="logo" />
        
        <nav className={styles.navLinks}>
          <a href="/">Home</a>
          <a href="/features">Special</a>
          <a href="/ContactUsPage">Contact Us</a>
          <a href="/contact">About Us</a>
        </nav>
        
        <img src={profile} className={styles.profile} alt="Profile" />
        
    </header>
  );
};

export default Header;