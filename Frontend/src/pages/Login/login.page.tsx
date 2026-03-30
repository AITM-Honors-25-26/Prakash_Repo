import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from './../../components/layout/layout';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // This is where you would call your API
    console.log("Login Attempt:", { email, password });
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