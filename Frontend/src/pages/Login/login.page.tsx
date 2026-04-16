import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../../assets/constants/constants';
import styles from "./loginpage.module.scss"
import logo from "../../../img/Logo.png"
import { toast, ToastContainer } from 'react-toastify';
import leftDesign from "../../../img/walpaper/1.png"
import 'react-toastify/dist/ReactToastify.css';


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password}),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Full Result Data:", result.data);
        
        const userStatus = result.data.status;
        if(userStatus === false){
          toast.error("Your account is not activated");
          return;
        }

        const token = result.data?.accessToken;
        if (token) {
          localStorage.setItem('token', token);   
          
          if(result.data?.user){
            localStorage.setItem('user', JSON.stringify(result.data.user));
          }else{
            localStorage.setItem('user',JSON.stringify(result.data))
          }

          toast.success("Login Successful!");

          window.location.href = '/'; 
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
      <ToastContainer position="top-right" theme="colored" autoClose={3000} />
      <section className={styles.whole}>
        <div className={styles.leftdisplay}>
          <img src={leftDesign} alt="Design" />
        </div>
        <div className={styles.rightdsiplay}>
          <img src={logo} alt="Bakery Logo" />
          <h2>Login to your account</h2>
          <form onSubmit={handleLogin}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.middle}>
              <div className={styles.remember}>
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className={styles.realCheckbox}
                />
                <label htmlFor="remember" className={styles.customBox}></label>
                <p>Remember Me</p>
              </div>
              <div className={styles.forgetpass}>
                <p><Link to="/ForgetPassPage">Forget Password?</Link></p>
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.loginBtn}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
};
export default LoginPage;