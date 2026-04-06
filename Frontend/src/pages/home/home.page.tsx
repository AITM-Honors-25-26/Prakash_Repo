import React from 'react';
import Layout from './../../components/layout/layout';
import { Link } from 'react-router-dom';
import profile from '../../../img/bakery photo.png'
import styles from './homepage.module.scss';

const Homepage: React.FC = () => {
  return (
    <Layout>
      <section className={styles.topsection}>
        <div className={styles.photoholder}><img src={profile} className={styles.photo} alt="" /></div>
        <div className={styles.welcomecontent}>
          <h1>My First Homepage</h1>
        <p>Testing the homepage.</p>
        <Link to="/LoginPage">
          <button>Login Now</button>
        </Link>





        <Link to="/RegisterPage">
          <button>Register Now</button>
        </Link>

        </div>
        
      </section>
    </Layout>
  );
};

export default Homepage;