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

          {/* Phone Card */}
          <div className={styles.infoCard}>
            <div className={styles.iconCircle}><img src={phone} alt="Phone" /></div>
            <h3>Call or Text</h3>
            <p>Mon - Fri: 9am - 6pm</p>
            <p className={styles.highlight}>+977 9869688338</p>
            <a href="tel:+9779869688338" className={styles.link}>Call Now</a>
          </div>

          {/* Email Card */}
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
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14128.143714275003!2d85.32832811282218!3d27.716156170669273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb19163e792049%3A0x6b402947113e6e89!2sBaluwatar%2C%20Kathmandu!5e0!3m2!1sen!2snp!4v1713795000000!5m2!1sen!2snp"
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