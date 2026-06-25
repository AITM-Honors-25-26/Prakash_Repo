import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, CloudFare_Captcha } from '../../../constants/constants';
import styles from './registerPage.module.scss'
import { toast, ToastContainer } from 'react-toastify';
import walpaper2 from '../../../../img/walpaper/2.png'
import 'react-toastify/dist/ReactToastify.css';
import uploadIcon from "./../../../../img/icons/upload.png"
import viewPasssword from "../../../../img/icons/ViewPassword.png"
import hidePassword from "../../../../img/icons/HidePassword.png"

// Import Turnstile CAPTCHA
import { Turnstile } from '@marsidev/react-turnstile';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // States for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for Cloudflare Token
  const [cfToken, setCfToken] = useState<string | null>(null);

  // State maps exactly to your Mongoose Schema
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    role: 'Waiter', // Set default to Waiter matching backend Schema
    gender: 'Male', // Assumes 'Male', 'Female', 'Other' in your Gender enum
    phone: '',
    dob: '',
  });
  const [image, setImage] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    // 2. CAPTCHA Validation
    if (!cfToken) {
      toast.error("Please complete the security check first.");
      return;
    }

    setLoading(true);
    
    // 3. Prepare FormData for file upload
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      // Don't send confirmPassword to the backend schema
      if (key !== 'confirmPassword') {
        data.append(key, value);
      }
    });
    
    if (image) {
      data.append('image', image);
    }
    data.append('cfToken', cfToken);
    
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Registration Successful!");
        navigate('/LoginPage');
      } else {
        if (result.error && typeof result.error === 'object') {
          const specificErrors = Object.values(result.error).join('\n');
          toast.error(`${result.message || "Registration Failed"}:\n\n${specificErrors}`);
        } else {
          toast.error(result.message || "Registration failed");
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" theme="colored" autoClose={3000} />
          
      <section className={styles.whole}>
        <div className={styles.cardWrapper}>
          
          <div className={styles.leftside}>
            <img src={walpaper2} alt="Wallpaper" />
          </div>

          <div className={styles.rightside}>
            <h2>Register Staff</h2>
            <form onSubmit={handleRegister}>
              
              {/* Maps to Schema: required, min 2, max 50 */}
              <input 
                name="fullName" 
                placeholder="Full Name" 
                onChange={handleChange} 
                required 
                minLength={2} 
                maxLength={50} 
              />
              
              {/* Maps to Schema: required, unique, lowercase handled by backend */}
              <input 
                name="email" 
                type="email" 
                placeholder="Email Address" 
                onChange={handleChange} 
                required 
              />
              
              {/* Password Field */}
              <div className={styles.passwordContainer}>
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  onChange={handleChange} 
                  required 
                  minLength={6}
                />
                <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                  <img 
                    src={showPassword ? hidePassword : viewPasssword} 
                    alt={showPassword ? "Hide Password" : "Show Password"} 
                    className={styles.passwordIconImg}
                  />
                </span>
              </div>

              {/* Confirm Password Field */}
              <div className={styles.passwordContainer}>
                <input 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm Password" 
                  onChange={handleChange} 
                  required 
                />
                <span className={styles.eyeIcon} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <img 
                    src={showConfirmPassword ? hidePassword : viewPasssword} 
                    alt={showConfirmPassword ? "Hide Password" : "Show Password"} 
                    className={styles.passwordIconImg}
                  />
                </span>
              </div>

              {/* Maps to Schema: address (required) */}
              <input 
                name="address" 
                placeholder="Full Address" 
                onChange={handleChange} 
                required 
              />
              
              {/* Row for Role and Gender (Enums) */}
              <div className={styles.row}>
                <select name="role" onChange={handleChange} value={formData.role}>
                  <option value="Waiter">Waiter</option> 
                  <option value="Chef">Chef</option>
                </select>
                
                <select name="gender" onChange={handleChange} value={formData.gender}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {/* Row for Phone and DOB */}
              <div className={styles.row}>
                <input 
                  name="phone" 
                  type="tel"
                  placeholder="Phone Number" 
                  onChange={handleChange} 
                  required 
                />
                <input 
                  name="dob" 
                  type="date" 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              {/* Custom File Upload for Schema 'image' */}
              <div className={styles.fileUploadContainer}>
                <label>Profile Image: </label>
                
                <label htmlFor="profile-upload" className={styles.customFileUpload}>
                  <img src={uploadIcon} alt="Upload Icon" className={styles.uploadIconImg} />
                  <span>{image ? image.name : "Click here to upload..."}</span>
                </label>

                <input 
                  id="profile-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className={styles.hiddenFileInput}
                  required 
                />
              </div>

              {/* Cloudflare CAPTCHA */}
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
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>
            
            <div className={styles.links}>
              <p>Already have an account? <Link to="/LoginPage">Login</Link></p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default RegisterPage;