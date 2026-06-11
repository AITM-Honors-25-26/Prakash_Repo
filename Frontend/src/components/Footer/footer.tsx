import React, { useState } from 'react';
import styles from './footer.module.scss';
import logWhite from '../../../img/log.white.png';
import x from '../../../img/logos/x.png';
import facebook from '../../../img/logos/Facebook.png';
import instagram from '../../../img/logos/instagarm.png';
import gmail from '../../../img/logos/gmail.png';
import { API_ENDPOINTS } from '../../constants/constants';

// 1. Import toast from react-toastify
import { toast } from 'react-toastify'; 

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsLoading(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.CONTACTADMIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, message }),
      });

      if (response.ok) {
        // 2. Use toast.success for a successful send
        toast.success('Thank you! Your message has been sent.');
        setEmail('');
        setMessage('');
      } else {
        // 3. Use toast.error for a failed response
        toast.error('Failed to send message. Please try again later.');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // 4. Use toast.error for network issues
      toast.error('Network error. Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.leftdiv}>
        <img src={logWhite} alt="Melina's Bakery Logo" />
        <h5>
          Nestled in the heart of Nepal, Melina’s Bakery is a cozy spot filled with the aroma of freshly baked breads and 
          handmade pastries. Whether you’re starting your day with a warm cup of tea or stopping by for a sweet treat, it’s 
          a little place of comfort for everyone.
        </h5>
        <div className={styles.logs}>
          <img src={x} className={styles.imglogo}  alt="X Logo" />
          <img src={facebook} className={styles.imglogo} alt="Facebook Logo" />
          <img src={instagram} className={styles.imglogo} alt="Instagram Logo" />
          <img src={gmail} className={styles.imglogo} alt="Gmail Logo" />
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
        <form className={styles.messagepart} onSubmit={handleSubmit}>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <textarea
            className={styles.messageinput}
            id="Message"
            placeholder="Enter the message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'SENDING...' : 'SEND'}
          </button>
        </form>
      </div>
    </footer>
  );
};

export default Footer;