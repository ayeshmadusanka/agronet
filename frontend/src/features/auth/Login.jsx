import React, { useState } from 'react';
import './auth.css';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { login } from './authAPI';

const Login = ({ onLogin, switchToRegister }) => {
  const [form, setForm] = useState({ email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('All fields are required.');
      return;
    }
    setError('');
    try {
      const res = await login(form.email, form.password);
      localStorage.setItem('token', res.data.token);

      // Fetch user info to get the role
      const userRes = await fetch(`${process.env.REACT_APP_API_URL}/user`, {
        headers: { Authorization: `Bearer ${res.data.token}` }
      });
      const userData = await userRes.json();
      console.log('User data:', userData);
      localStorage.setItem('role', userData.role);

      window.location.href = '/dashboard'; // Redirect to dashboard page
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-header">
          <div className="auth-logo"></div>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your AgroNet dashboard</p>
        </div>
        
        <InputField
          label="Email Address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email address"
          required
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
        />
        
        {error && <div className="auth-error">{error}</div>}
        <Button type="submit" text="Sign In" />
        <div className="auth-link">
          <span>New to AgroNet?</span>
          <button type="button" onClick={switchToRegister} className="auth-link-btn">
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
