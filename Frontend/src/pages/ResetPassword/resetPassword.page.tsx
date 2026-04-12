import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../../assets/constants/constants';
import styles from "./resetPassword.page.module.scss"; 
import logo from "../../../img/Logo.png";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
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
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.RESETPASSWORD, {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
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
          navigate('/login');
        }, 3000);
      } else {
        toast.error(result.message || "Failed to reset password. The token might be expired.");
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
          <h2>Create New Password</h2>
          <p>
            Please enter your new password below.
          </p>
          
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

            <button type="submit" disabled={loading} style={{ marginTop: "20px" }}>
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