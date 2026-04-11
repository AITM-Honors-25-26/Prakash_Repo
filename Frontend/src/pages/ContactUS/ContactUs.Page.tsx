import React from 'react';
import Layout from './../../components/layout/layout';
import location from '../../../img/logos/location.png'
import styles from './ContactUsPage.module.scss';

const ContactUs: React.FC = () => {
  return (
    <Layout>
      <section className={styles.whole}>
        <div className={styles.header}>
            <h1>Get in touch with us <span>for more information</span></h1>  
        </div>
        <div className={styles.bottomSection}>
            <div className={styles.bottomSection1}>
                <img src={location} alt="" />
                <p>hello</p>
            </div>
            <div className={styles.bottomSection2}>
                <p>this is 2</p>
            </div>
            <div className={styles.bottomSection3}>
                <p>tihs is 3</p>
            </div>
        </div>
      </section>
    </Layout>
  );
};
export default ContactUs;