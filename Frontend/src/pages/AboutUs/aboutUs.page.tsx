import React from 'react';
import Layout from './../../components/layout/layout';
import styles from './aboutUs.Page.module.scss';
import bakeryHero from '../../../img/bakery photo.png'; 

const AboutUsPage: React.FC = () => {
  return (
    <Layout>
      <section className={styles.aboutContainer}>
        <div className={styles.whole}>
          <h1>Baked with Love</h1>
          <p>From our oven to your table handcrafted treats made with organic ingredients and a dash of magic.</p>
        </div>
        <div className={styles.contentGrid}>
          <div className={styles.imageWrapper}>
             <img src={bakeryHero} alt="Malina's Bakery Fresh Bread" />
          </div>
          <div className={styles.textBlock}>
            <h2>Our Sweet Journey</h2>
            <p>
              Melina’s Bakery started in a small home kitchen with a single whisk and a 
              passion for perfect crusts. Today, we remain committed to the 
              art of slow-baking. We believe that the best bread takes time, 
              and the best memories are made over a slice of cake.
            </p>
            <div className={styles.signature}>- Melina</div>
          </div>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.icon}>🌾</span>
            <h3>Organic Flour</h3>
            <p>Sourced from local sustainable farms.</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.icon}>⏰</span>
            <h3>24h Fermentation</h3>
            <p>For that perfect sourdough tang.</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.icon}>☕</span>
            <h3>Fresh Coffee</h3>
            <p>The perfect partner for your pastry.</p>
          </div>
        </div>
        <div className={styles.valuesSection}>
          <div className={styles.valueCard}>
            <h3>Our Promise</h3>
            <p>No preservatives. No artificial flavors. Just honest, real food that makes you smile.</p>
          </div>
          <div className={styles.valueCard}>
            <h3>Community</h3>
            <p>We’re more than a shop. We are a gathering place for the Baluwatar community.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default AboutUsPage;