import React from 'react';
import Layout from './../../components/layout/layout';
import { Link } from 'react-router-dom';
import profile from '../../../img/bakery photo.png'
import logowhite from '../../../img/log.white.png'
import styles from './homepage.module.scss';

const Homepage: React.FC = () => {
  return (
    <Layout>
      <section className={styles.topsection}>
        <div className={styles.photoholder}>
          <img src={profile} className={styles.photo} alt="Fresh baked goods" />
        </div>
        <div className={styles.welcomecontent}>
          <img src={logowhite} className={styles.logo} alt="Flower Bakery Logo" />
          <h1>Welcome to the Bakery</h1>
          <p className={styles.slogan}>Where passion blooms and pastries rise.</p>
          <div className={styles.actionArea}>
            <Link to="/LoginPage">
              <button className={styles.logbutton}>Login Now</button>
            </Link>
            <div className={styles.registerPrompt}>
              <span className={styles.divider}><p>or</p></span>
              <p>Don't have an account yet?</p>
              <Link to="/RegisterPage">
                <button className={styles.registerbutton}>Register Now</button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default Homepage;