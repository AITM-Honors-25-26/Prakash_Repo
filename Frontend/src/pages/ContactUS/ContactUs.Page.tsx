import React from 'react';
import Layout from './../../components/layout/layout';


import styles from './ContactUsPage.module.scss';

const ContactUs: React.FC = () => {
  return (
    <Layout>
      <section className={styles.whole}>
        <div className={styles.header}>
            <h1>Get in touch with us <span>for more information</span></h1>  
        </div>
        <div></div>
          
          

      </section>
    </Layout>
  );
};

export default ContactUs;