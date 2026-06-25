import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// Updated to include CloudFare_Captcha
import { API_ENDPOINTS, CloudFare_Captcha } from '../../../constants/constants';
import styles from "./forgotPassword.module.scss";
import logo from "../../../../img/Logo.png";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Turnstile
import { Turnstile } from '@marsidev/react-turnstile';

const ForgetPassPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Add state to hold the Cloudflare token
  const [cfToken, setCfToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block submission if CAPTCHA isn't solved
    if (!cfToken) {
      toast.error("Please complete the security check first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.FORGETPASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Append the cfToken to the backend request payload
        body: JSON.stringify({ email, cfToken }),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        result = {};
      }
      if (response.ok) {
        toast.success(result.message || "Password reset link sent! Please check your email.");
        setEmail(''); 
      } else {
        toast.error(result.message || "Failed to process request. Please check the email and try again.");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Network error. Check if backend is running and CORS is enabled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" theme="colored" autoClose={3000} />
      <section className={styles.whole}>
        <div></div>
        <div className={styles.leftdisplay}>
          <img src={logo} alt="Company Logo" />
        </div>
        <div className={styles.rightdsiplay}>
          <img src={logo} className={styles.smallLogo} alt="Company Logo" />
          <h2>Forgot Your Password?</h2>
          <p>
            Enter your email address that you used to register.
          </p>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Cloudflare CAPTCHA added here */}
            <div className={styles.captchaContainer}>
              <Turnstile 
                siteKey={CloudFare_Captcha.SITE_KEY}
                onSuccess={(token) => setCfToken(token)}
                options={{
                  theme: 'light', 
                }}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <div className={styles.links}>
            <p><Link to="/LoginPage">Back to Login</Link></p> 
          </div>
        </div>
      </section>
    </>
  );
};
export default ForgetPassPage;