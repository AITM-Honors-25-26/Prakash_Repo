import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../assets/constants/constants';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    role: 'Employee', 
    gender: 'Male',
    phone: '',
    dob: '',
  });

  const [image, setImage] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Create FormData object to handle text + file
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    
    if (image) {
      data.append('image', image);
    }

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        // Note: Do NOT set Content-Type header when sending FormData
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Registration Successful!");
        navigate('/login');
      } else {
        alert(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input name="fullName" placeholder="Full Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required />
        <input name="address" placeholder="Address" onChange={handleChange} required />
        
        <select name="role" onChange={handleChange}>
          <option value="Admin">Admin</option>
          <option value="Chef">Chef</option>
          <option value="Witer">Waiter</option>
          <option value="Employee">Employee</option>
        </select>

        <select name="gender" onChange={handleChange}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <input name="phone" placeholder="Phone" onChange={handleChange} required />
        <input name="dob" type="date" onChange={handleChange} required />
        
        <div>
          <label>Profile Image: </label>
          <input type="file" accept="image/*" onChange={handleFileChange} required />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </section>
  );
};

export default RegisterPage;