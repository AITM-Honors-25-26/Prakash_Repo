import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './footer.module.scss';
import logWhite from '../../../img/log.white.png';
import x from '../../../img/logos/x.png';
import facebook from '../../../img/logos/Facebook.png';
import instagram from '../../../img/logos/instagarm.png';
import gmail from '../../../img/logos/gmail.png';
import locationIcon from '../../../img/icons/location.png';
import phoneIcon from '../../../img/icons/phone.png';
import emailIcon from '../../../img/icons/email.png';
import { API_ENDPOINTS, CloudFare_Captcha, MAPURL } from '../../constants/constants';

import { toast } from 'react-toastify';

import { Turnstile } from '@marsidev/react-turnstile';

const socialLinks = [
  { label: 'X (Twitter)', href: 'https://x.com/', img: x },
  { label: 'Facebook', href: 'https://www.facebook.com/', img: facebook },
  { label: 'Instagram', href: 'https://www.instagram.com/', img: instagram },
  { label: 'Email', href: 'mailto:prakashbudha2003@gmail.com', img: gmail },
];

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [cfToken, setCfToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cfToken) {
      toast.error('Please complete the security check first.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.CONTACTADMIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, message, cfToken }),
      });

      if (response.ok) {
        toast.success('Thank you! Your message has been sent.');
        setEmail('');
        setMessage('');
        setCfToken(null);
      } else {
        toast.error('Failed to send message. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Network error. Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.brandColumn}>
          <img src={logWhite} alt="Melina's Bakery Logo" className={styles.logo} />
          <p className={styles.tagline}>
            Nestled in the heart of Nepal, Melina’s Bakery is a cozy spot filled with the aroma of freshly baked breads
            and handmade pastries. Whether you’re starting your day with a warm cup of tea or stopping by for a sweet
            treat, it’s a little place of comfort for everyone.
          </p>
          <div className={styles.socials}>
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                aria-label={link.label}
                title={link.label}
              >
                <img src={link.img} alt={link.label} />
              </a>
            ))}
          </div>
        </div>

        <div className={styles.linksColumn}>
          <h3 className={styles.columnTitle}>Quick Links</h3>
          <nav className={styles.navLinks} aria-label="Footer quick links">
            <Link to="/">Home</Link>
            <Link to="/MenuPage">Menu</Link>
            <Link to="/ContactUsPage">Contact Us</Link>
            <Link to="/AboutUsPage">About Us</Link>
          </nav>
        </div>

        <div className={styles.contactColumn}>
          <h3 className={styles.columnTitle}>Contact Us</h3>
          <ul className={styles.contactList}>
            <li>
              <img src={locationIcon} alt="" />
              <a href={MAPURL.MAP} target="_blank" rel="noreferrer">
                Baluwatar, Kathmandu
              </a>
            </li>
            <li>
              <img src={phoneIcon} alt="" />
              <a href="tel:+9779869688338">+977 9869688338</a>
            </li>
            <li>
              <img src={emailIcon} alt="" />
              <a href="mailto:prakashbudha2003@gmail.com">prakashbudha2003@gmail.com</a>
            </li>
          </ul>
        </div>

        <div className={styles.messageColumn}>
          <h3 className={styles.columnTitle}>Send Message</h3>
          <form className={styles.messageForm} onSubmit={handleSubmit}>
            <input
              id="footer-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <textarea
              id="footer-message"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={isLoading}
            />
            <div className={styles.captcha}>
              <Turnstile
                siteKey={CloudFare_Captcha.SITE_KEY}
                onSuccess={(token) => setCfToken(token)}
                onError={() => setCfToken(null)}
                onExpire={() => setCfToken(null)}
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'SENDING...' : 'SEND MESSAGE'}
            </button>
          </form>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>© {new Date().getFullYear()} Melina’s Bakery. All rights reserved.</p>
        <p className={styles.bottomLinks}>
          <Link to="/ContactUsPage">Contact</Link>
          <span className={styles.separator}>•</span>
          <Link to="/AboutUsPage">About</Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
