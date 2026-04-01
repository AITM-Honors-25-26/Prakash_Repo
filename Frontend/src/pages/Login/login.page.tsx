import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://192.168.1.67:9005/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});
      const result = await response.json();

      if (response.ok) {
        console.log("Success:", result);
        localStorage.setItem('token', result.token); 
        
        alert("Login Successful!");
        navigate('/');
      } else {
        alert(result.message || "Invalid credentials");
      }
    } catch (error) {
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