import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_ENDPOINTS } from '../../../constants/constants';
import styles from "./resetPassword.page.module.scss"; 
import logo from "../../../../img/Logo.png";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new link.");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA to proceed.");
      return;
    }

    setLoading(true);
    
    try {
      // Note: Make sure your backend expects and verifies the 'captchaToken'
      const response = await fetch(API_ENDPOINTS.RESETPASSWORD, {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, captchaToken }),
      });
      
      let result;
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (response.ok) {
        toast.success(result.message || "Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate('/LoginPage');
        }, 3000);
      } else {
        toast.error(result.message || "Failed to reset password. The token might be expired.");
        // Reset captcha so the user has to solve it again on failure
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Network error. Check if backend is running and CORS is enabled.");
      // Reset captcha on network error as well
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
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
          <h2>Create New Password</h2>
          <p>Please enter your new password below.</p>
          
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ marginTop: "15px", marginBottom: "15px" }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || "YOUR_RECAPTCHA_SITE_KEY"}
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>

            <button type="submit" disabled={loading || !captchaToken} style={{ marginTop: "10px" }}>
              {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPasswordPage;