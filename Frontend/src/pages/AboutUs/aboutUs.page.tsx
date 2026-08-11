import React from 'react';
import Layout from './../../components/layout/layout';
import styles from './aboutUs.Page.module.scss';
import bakeryHero from '../../../img/bakery photo.png'; 

const AboutUsPage: React.FC = () => {
  return (
    <Layout>
      <div className={styles.aboutContainer}>
        
        <section className={styles.topGrid}>
          
          <div className={styles.leftColumn}>
            <h1 className={styles.hugeHeading}>ABOUT<br/>US</h1>
            
            <h3 className={styles.subHeading}>Artisan Breads & Pastries</h3>
            <p className={styles.bodyText}>
              Baked with Love: Designs featuring clean ingredients, natural palettes, and high-quality local produce.
            </p>
          </div>

          <div className={styles.rightColumn}>
            <img src={bakeryHero} alt="Bakery Interior" className={styles.mainImage} />
            
            <div className={styles.sideImages}>
              <img src={bakeryHero} alt="Fresh Bread" className={styles.smallImage} />
              <div className={styles.philosophyBox}>
                <h3>Our Philosophy</h3>
                <p>
                  At Melina's Bakery, we believe in creating delicious, handcrafted treats that reflect our clients' tastes and lifestyles.
                </p>
              </div>
            </div>
          </div>
          
        </section>

        <section className={styles.teamSection}>
          
          <div className={styles.teamTitleBox}>
            <div className={styles.meetThe}>MEET THE</div>
            <div className={styles.principals}>BAKERS</div>
          </div>

          <div className={styles.teamCenterText}>
            <div className={styles.smallGallery}>
              <img src={bakeryHero} alt="Pastry detail 1" />
              <img src={bakeryHero} alt="Pastry detail 2" />
              <img src={bakeryHero} alt="Pastry detail 3" />
            </div>
            <p>
              As head baker and licensed pastry chef, the founder oversees the day-to-day operations of Melina's Bakery and the design and manufacture of our award-winning cakes and pastries.
            </p>
          </div>

          <div className={styles.teamMember}>
            <img src={bakeryHero} alt="Melina" />
            <h4>Melina</h4>
            <span>FOUNDER AND HEAD BAKER</span>
          </div>

          <div className={styles.teamMember}>
            <img src={bakeryHero} alt="David" />
            <h4>David</h4>
            <span>CO-FOUNDER AND MANAGER</span>
          </div>

        </section>
        
      </div>
    </Layout>
  );
};

export default AboutUsPage;
