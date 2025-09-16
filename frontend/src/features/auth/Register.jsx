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
    address: '',
    phone: '',
    farm_location: '',
    district: '',
    city: '',
    crop_types: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCrop, setNewCrop] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addCrop = () => {
    if (newCrop.trim() && !form.crop_types.includes(newCrop.trim())) {
      setForm({ ...form, crop_types: [...form.crop_types, newCrop.trim()] });
      setNewCrop('');
    }
  };

  const removeCrop = (cropToRemove) => {
    setForm({
      ...form,
      crop_types: form.crop_types.filter(crop => crop !== cropToRemove)
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Base validation
    if (!form.name || !form.email || !form.password || !form.address) {
      setError('All fields are required.');
      setSuccess('');
      return;
    }

    // Additional validation for farmers
    if (form.role === 'farmer') {
      if (!form.phone || !form.farm_location || !form.district || !form.city) {
        setError('All farmer fields are required.');
        setSuccess('');
        return;
      }
      if (form.crop_types.length === 0) {
        setError('Please add at least one crop type.');
        setSuccess('');
        return;
      }
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

        {/* Farmer-specific fields */}
        {form.role === 'farmer' && (
          <>
            <InputField
              label="Phone Number"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />

            <InputField
              label="Farm Location"
              name="farm_location"
              type="text"
              value={form.farm_location}
              onChange={handleChange}
              placeholder="Describe your farm location (e.g., Village/Area name)"
              required
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <InputField
                label="District"
                name="district"
                type="text"
                value={form.district}
                onChange={handleChange}
                placeholder="Enter your district"
                required
                style={{ flex: 1 }}
              />

              <InputField
                label="City"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter your city"
                required
                style={{ flex: 1 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Crop Types You Provide *</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  placeholder="Type crop name (e.g., Rice, Wheat, Tomato)"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCrop())}
                />
                <button
                  type="button"
                  onClick={addCrop}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>

              {form.crop_types.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {form.crop_types.map((crop, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: '#e8f5e8',
                        color: '#2d5a2d',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '16px',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {crop}
                      <button
                        type="button"
                        onClick={() => removeCrop(crop)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2d5a2d',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          lineHeight: '1'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}


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
