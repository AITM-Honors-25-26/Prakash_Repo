import React from 'react';
import styles from './footer.module.scss';
import log0 from '../../../img/Logo.png'
const Footer: React.FC = () => {
  return (

    <footer className={styles.footer}>
          <div className={styles.leftdiv}>
            <img src={log0} alt="" />
            <h2>Flower Bakery</h2>
          </div>
          <div className={styles.middlediv}>
          </div>
          <div className={styles.rightdiv}>
          </div>
    </footer>
  );
};

export default Footer;