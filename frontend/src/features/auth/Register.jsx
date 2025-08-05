import React, { useState } from 'react';
import './auth.css';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { register } from './authAPI';

const Register = ({ switchToLogin }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.address) {
      setError('All fields are required.');
      setSuccess('');
      return;
    }
    setError('');
    try {
      const res = await register(form);
      setSuccess('Registration successful! You can now log in.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setSuccess('');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-header">
          <div className="auth-logo"></div>
          <h2>Join AgroNet</h2>
          <p className="auth-subtitle">Create your account to start connecting farmers and customers</p>
        </div>
        
        <InputField
          label="Full Name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
        />
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
          placeholder="Create a secure password"
          required
        />
        <InputField
          label="Address"
          name="address"
          type="text"
          value={form.address}
          onChange={handleChange}
          placeholder="Enter your complete address"
          required
        />
        
        <div className="form-group">
          <label className="form-label">Account Type</label>
          <div className="auth-radio-group">
            <div className="radio-option">
              <input
                type="radio"
                name="role"
                value="customer"
                id="customer"
                checked={form.role === 'customer'}
                onChange={handleChange}
              />
              <label htmlFor="customer" className="radio-label">
                <span className="radio-icon">🛒</span>
                <span>Customer</span>
              </label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                name="role"
                value="farmer"
                id="farmer"
                checked={form.role === 'farmer'}
                onChange={handleChange}
              />
              <label htmlFor="farmer" className="radio-label">
                <span className="radio-icon">🚜</span>
                <span>Farmer</span>
              </label>
            </div>
          </div>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <Button type="submit" text="Create Account" />
        <div className="auth-link">
          <span>Already have an account?</span>
          <button type="button" onClick={switchToLogin} className="auth-link-btn">
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
