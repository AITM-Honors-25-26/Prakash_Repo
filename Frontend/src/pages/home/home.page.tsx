import React, { useState } from 'react';
import Layout from './../../components/layout/layout';
import { Link } from 'react-router-dom';
import profile from '../../../img/bakery photo.png';
import logowhite from '../../../img/log.white.png';
import styles from './homepage.module.scss';

const Homepage: React.FC = () => {
  const [userData] = useState(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        return JSON.parse(userString);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  });
  const isLoggedIn = !!userData; 
  const userName = userData?.name || '';

  return (
    <Layout>
      <section className={styles.topsection}>
        <div className={styles.photoholder}>
          <img src={profile} className={styles.photo} alt="Fresh baked goods" />
        </div>
        <div className={styles.welcomecontent}>
          <img src={logowhite} className={styles.logo} alt="Flower Bakery Logo" />
          
          {isLoggedIn ? (
            <div className={styles.loggedInArea}>
              <h1>Hello, {userName}!</h1>
              <p>We are so glad to see you again.</p>
            </div>
          ) : (
            <>
              <h1>Welcome to the Bakery</h1>
              <p className={styles.slogan}>Where passion blooms and pastries rise.</p>
              <div className={styles.actionArea}>
                <Link to="/LoginPage" className={styles.logbutton}>
                  Login Now
                </Link>
                <div className={styles.registerPrompt}>
                  <span className={styles.divider}><p>or</p></span>
                  <p>Don't have an account yet?</p>
                  <Link to="/RegisterPage" className={styles.registerbutton}>
                    Register Now
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Homepage;