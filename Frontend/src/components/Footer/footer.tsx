import React from 'react';
import styles from './footer.module.scss';
import logWhite from '../../../img/log.white.png';
import x from '../../../img/logos/x.png';
import facebook from '../../../img/logos/Facebook.png';
import instagram from '../../../img/logos/instagarm.png';
import gmail from '../../../img/logos/gmail.png';

const Footer: React.FC = (  ) => {
  return (
    <footer className={styles.footer}>
          <div className={styles.leftdiv}>
            <img src={logWhite} alt="" />
            <h2>Flower Bakery</h2>
            <div>
            <img src={x} className={styles.imglogo}  alt="" />
            <img src={facebook} className={styles.imglogo} alt="" />
            <img src={instagram} className={styles.imglogo} alt="" />
            <img src={gmail} className={styles.imglogo} alt="" />
            </div>
          </div>
          <div className={styles.middlediv}>
          </div>
          <div className={styles.rightdiv}>
          </div>
    </footer>
  );
};
export default Footer;