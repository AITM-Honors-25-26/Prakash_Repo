import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.67:9005/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (response.ok) {
        const token = result.data?.accessToken;

        if (token) {
          localStorage.setItem('token', token);
          alert("Login Successful!");
          navigate('/');
        } else {
          alert("Login failed: No token received");
        }
      } else {
        alert(result.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Check if backend is running and CORS is enabled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>Or go back to <Link to="/">Home</Link></p>
    </section>
  );
};

export default LoginPage;