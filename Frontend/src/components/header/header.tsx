import React from 'react';
import styles from './header.module.scss';
import profile from './../../../img/profile.png'
import logowhite from './../../../img/log.white.png'

const Header: React.FC = () => {
  return (

    <header className={styles.header}>
      
        <a href="/">
          <img src={logowhite} className={styles.logo} alt="logo" />
        </a>
        <nav className={styles.navLinks}>
          <a href="/">Home</a>
          <a href="/features">Special</a>
          <a href="/ContactUsPage">Contact Us</a>
          <a href="/AboutUsPage">About Us</a>
        </nav>
        
        <img src={profile} className={styles.profile} alt="Profile" />
        
    </header>
  );
};

export default Header;