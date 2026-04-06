import React from 'react';
import Layout from './../../components/layout/layout';
import { Link } from 'react-router-dom';
import profile from '../../../img/bakery photo.png'
import logo from '../../../img/Logo.png'
import styles from './homepage.module.scss';

const Homepage: React.FC = () => {
  return (
    <Layout>
      <section className={styles.topsection}>
        <div className={styles.photoholder}><img src={profile} className={styles.photo} alt="" /></div>
        <div className={styles.welcomecontent}>
          <img src={logo} className={styles.logo} alt="logo" />
          <h1>Welcome to the Bakery</h1>
        <p>Where passion blooms and pastries rise.</p>
        <Link to="/LoginPage">
          <button className={styles.logbutton}>Login Now</button>
        </Link>
        <Link to="/RegisterPage">
          <button className={styles.registerbutton}>Register Now</button>
        </Link>

        </div>
        
      </section>
    </Layout>
  );
};

export default Homepage;