import React from 'react';
import Layout from './../../components/layout/layout';
import styles from './ContactUsPage.module.scss';
import location from '../../../img/icons/location.png';
import phone from '../../../img/icons/phone.png';
import email from '../../../img/icons/email.png';
import { MAPURL } from '../../constants/constants';

const ContactUs: React.FC = () => {
  return (
    <Layout>
      <section className={styles.contactContainer}>
        <div className={styles.textHeader}>
          <h1>Connect With Us</h1>
          <h3>We’re here to help. Reach out through any of these channels.</h3>
        </div>
        <div className={styles.boxwhole}>
          <div className={styles.infoCard}>
            <div className={styles.iconCircle}><img src={location} alt="Location" /></div>
            <h3>Our Office</h3>
            <p>Baluwatar, Kathmandu</p>
            <p>बालुवाटार, काठमाडौं</p>
            <a href={MAPURL.MAP} target="_blank" rel="noreferrer" className={styles.link}>
              Go to map
            </a>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.iconCircle}><img src={phone} alt="Phone" /></div>
            <h3>Call or Text</h3>
            <p>Mon - Fri: 9am - 6pm</p>
            <p className={styles.highlight}>+977 9869688338</p>
            <a href="tel:+9779869688338" className={styles.link}>Call Now</a>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.iconCircle}><img src={email} alt="Email" /></div>
            <h3>Email Support</h3>
            <p>General Inquiries</p>
            <p className={styles.highlight}>prakashbudha2003@gmail.com</p>
            <a href="mailto:prakashbudha2003@gmail.com" className={styles.link}>Send Email</a>
          </div>
          <div className={styles.mapdisplay}>
          <iframe
            title="Office Location"
            src={MAPURL.LOCATION}
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default ContactUs;