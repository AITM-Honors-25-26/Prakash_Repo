import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // For redirecting after login

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Point to your Express URL (ensure port matches your backend)
      const response = await fetch('http://localhost:9005/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        // 2. Success: Save the token if your backend sends one
        console.log("Success:", result);
        localStorage.setItem('token', result.token); 
        
        alert("Login Successful!");
        navigate('/'); // Send user to Home page
      } else {
        // 3. Server-side error (e.g., 401 Unauthorized)
        alert(result.message || "Invalid credentials");
      }
    } catch (error) {
      // 4. Network error (Server is down or CORS failed)
      console.error("Connection error:", error);
      alert("Cannot connect to the server. Check if the backend is running.");
    }
  };

  return (
    <section>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email:</label>
          <input 
            id="email"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input 
            id="password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Sign In</button>
      </form>
      <div>
        <p>Or go back to <Link to="/">Home</Link></p>
      </div>
    </section>
  );
};

export default LoginPage;