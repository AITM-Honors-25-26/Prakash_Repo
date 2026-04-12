import React from 'react';
import styles from './footer.module.scss';
import logWhite from '../../../img/log.white.png';
import x from '../../../img/logos/x.png';
import facebook from '../../../img/logos/Facebook.png';
import instagram from '../../../img/logos/instagarm.png';
import gmail from '../../../img/logos/gmail.png';

const Footer: React.FC = (  ) => {
  return (
    <footer className={styles.footer}>
          <div className={styles.leftdiv}>
            <img src={logWhite} alt="" />
            <h5>Nestled in the heart of Nepal, Melina's Bakery is your warm, welcoming destination for freshly 
              baked delights. From the irresistible aroma of crusty artisan breads to a vibrant display of mouth-watering, 
              handcrafted pastries, every treat is baked with love and the finest ingredients. Whether you are starting your 
              morning with a hot cup of local tea or craving a sweet afternoon escape, Melina's Bakery offers a cozy slice of 
              comfort for both locals and travelers alike.</h5>
            <div className={styles.logs}>
            <img src={x} className={styles.imglogo}  alt="" />
            <img src={facebook} className={styles.imglogo} alt="" />
            <img src={instagram} className={styles.imglogo} alt="" />
            <img src={gmail} className={styles.imglogo} alt="" />
            </div>
          </div>
          <div className={styles.middlleftediv}>

          </div>
          <div className={styles.middlrightediv}>
            <nav className={styles.navLinks}>
              <p>Quick Links</p>
              <a href="/">Home</a>
              <a href="/MenuPage">Menu</a>
              <a href="/ContactUsPage">Contact Us</a>
              <a href="/AboutUsPage">About Us</a>
            </nav>
          </div>
          <div className={styles.rightdiv}>
            <h2>Send message</h2>
            <div className={styles.messagepart}>
              <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  // value={email}
                  // onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  id="Message"
                  type="text"
                  placeholder="Enter the message"
                  // value={email}
                  // onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button>SEND</button>
              </div>
          </div>
    </footer>
  );
};
export default Footer;