import React from 'react';
import styles from './header.module.scss'; // You would create this SCSS file

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>MyApp</div>
      <nav className={styles.navLinks}>
        <a href="/">Home</a>
        <a href="/features">Features</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
  );
};

export default Header;