import React, { useState } from 'react';
import './CustomerDashboard.css';
import './ContractStyles.css';

const CreateContract = ({ onContractCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    crop_type: '',
    quantity_needed: '',
    preferred_price_per_kilo: '',
    deadline: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to create contract');
      }

      await response.json();
      setSuccess('✅ Contract created successfully! Farmers can now place bids.');
      setForm({
        title: '',
        description: '',
        crop_type: '',
        quantity_needed: '',
        preferred_price_per_kilo: '',
        deadline: '',
        location: ''
      });

      // Call the callback to refresh stats
      if (onContractCreated) {
        onContractCreated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-contract">
      <div className="dashboard-header">
        <h2>Create New Contract</h2>
        <p>Post your crop requirements and let farmers bid on your contract</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="contract-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Contract Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Need 500kg Premium Rice"
                required
              />
            </div>

            <div className="form-group">
              <label>Crop Type *</label>
              <input
                type="text"
                name="crop_type"
                value={form.crop_type}
                onChange={handleChange}
                placeholder="e.g., Rice, Wheat, Tomato"
                required
              />
            </div>

            <div className="form-group">
              <label>Quantity Needed (kg) *</label>
              <input
                type="number"
                name="quantity_needed"
                value={form.quantity_needed}
                onChange={handleChange}
                placeholder="500"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Preferred Price per Kilo ($) *</label>
              <input
                type="number"
                name="preferred_price_per_kilo"
                value={form.preferred_price_per_kilo}
                onChange={handleChange}
                placeholder="2.50"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Deadline *</label>
              <input
                type="datetime-local"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="City, State"
                required
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your requirements, quality standards, delivery preferences, etc."
              rows="4"
              required
            />
          </div>

          {error && <div className="error-message">❌ {error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Creating Contract...' : 'Create Contract'}
          </button>
        </form>
      </div>

      <div className="info-box">
        <h3>📋 How the NEW contract system works:</h3>
        <ol>
          <li>📝 Create a contract with your crop requirements</li>
          <li>👨‍🌾 Farmers place bids with their quantity and price offers</li>
          <li>🏆 Contract automatically goes to the LOWEST QUALIFIED bidder</li>
          <li>✅ Deal is completed automatically - no manual selection needed!</li>
        </ol>
        <div className="highlight-box">
          <strong>💡 New Feature:</strong> Contracts are now awarded automatically to the farmer with the lowest price who can meet your quantity requirements!
        </div>
      </div>
    </div>
  );
};

export default CreateContract;