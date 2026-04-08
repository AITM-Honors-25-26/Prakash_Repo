import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../assets/constants/constants';
import styles from "./forgotPassword.module.scss"

import logo from "../../../img/Logo.png"
import { toast, ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

const ForgetPassPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.FORGETPASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email}),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (response.ok) {
        console.log("Full Result Data:", result.data);
        const userStatus = result.data.status;
        if(userStatus === false){
          toast.error("Your account is not activated")
          return;
        }
        const token = result.data?.accessToken;

        if (token) {
          localStorage.setItem('token', token);
          toast.success("Login Successful!");
          navigate('/');
        } else {
          toast.error("Login failed: No token received");
        }
      } else {
        toast.error(result.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Check if backend is running and CORS is enabled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <ToastContainer position="top-right" autoClose={3000} />
    
   <section className={styles.whole}>
    <div>

    </div>
  <div className={styles.leftdisplay}>
    <img src={logo} alt="Company Logo" />
  </div>

  <div className={styles.rightdsiplay}>
    <img src={logo} className={styles.smallLogo} alt="Company Logo" />
    <h2>Forget Your Password</h2>
    <form onSubmit={handleLogin}>
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
      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>

    <div className={styles.links}>
      <p><Link to="/">Back to Home</Link></p>
    </div>
  </div>
</section>
</>
  );
};

export default ForgetPassPage;