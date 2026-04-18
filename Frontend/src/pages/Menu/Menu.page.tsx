import React from 'react';
import styles from './MenuPage.module.scss';
import Layout from '../../components/layout/layout';
import bread from '../../../img/bread.png';
import cartwhite from '../../../img/icons/cart.white.png';

const MenuPage: React.FC = () => {
  return (
    <Layout>
      <div className={styles.main}>
        
        <div className={styles.topic}>
          <h1>Hot sales</h1>
        </div>
        
        <div className={styles.itemSection}>
            <div className={styles.photosection}>
              <img src={bread} alt="Fresh Bread" />
              
              <div className={styles.overlay}>
                <h3>Artisan Bread</h3>
                <p>This is for the description part</p>
                <p>$5.99</p>
                
                <div className={styles.buttonDiv}>
                  Add to cart 
                  <img src={cartwhite} alt="Cart icon" />
                </div>
              </div>

            </div>
          </div>
          
      </div>
    </Layout>
  );
};

export default MenuPage;