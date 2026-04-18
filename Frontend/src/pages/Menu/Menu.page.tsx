import React from 'react';
import styles from './MenuPage.module.scss';
import Layout from '../../components/layout/layout';
import bread from '../../../img/bread.png';

const MenuPage: React.FC = () => {
  return (
    <Layout>
      <div className={styles.main}>
        <div className={styles.topic}>
          <h1>Hot sales</h1>
        </div>
        
        <div className={styles.itemSection}>
          <div className={styles.itembox}>
            <div className={styles.photosection}>
              <img src={bread} alt="Fresh Bread" />
              <div className={styles.overlay}>
                <h3>Artisan Bread</h3>
                <p>$5.99</p>
                <button>Add to cart</button>
              </div>
            </div>
          </div>
          {/* End of itembox */}
        </div>
      </div>
    </Layout>
  );
};

export default MenuPage;