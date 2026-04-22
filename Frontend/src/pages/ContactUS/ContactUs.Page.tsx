import React from 'react';
import Layout from './../../components/layout/layout';
import styles from './ContactUsPage.module.scss';
import location from '../../../img/icons/location.png'
import phone from '../../../img/icons/phone.png'
import email from '../../../img/icons/email.png'

const ContactUs: React.FC = () => {
  return (
    <Layout>
      <section className={styles.contactContainer}>
        <h1>Connect With Us</h1>
        <h3>We’re here to help. Reach out through any of these channels.</h3>
        <div className={styles.boxwhole}>
          <div className={styles.leftdiv}>
            <img src={location} alt="" />
            <h3>Our Office</h3>

          </div>
          <div className={styles.middlediv}>
            <img src={phone} alt="" />
            <h3>Call or Text</h3>

          </div>
          <div className={styles.rightdiv}>
            <img src={email} alt="" />
            <h3>Email Support</h3>

          </div>
        </div>
        
      </section>
    </Layout>
  );
};

export default ContactUs;