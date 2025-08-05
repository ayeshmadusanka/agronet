import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { createContract, getFarmers } from './adminAPI';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const CreateContractForm = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    deadline: '',
    status: 'pending',
    farmer_ids: []
  });
  const [farmers, setFarmers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getFarmers().then(res => {
      setFarmers(
        (res.data.farmers || []).map(farmer => ({
          value: farmer._id || farmer.id,
          label: farmer.name + ' (' + farmer.email + ')'
        }))
      );
    });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStatusChange = option => {
    setForm({ ...form, status: option.value });
  };

  const handleFarmersChange = selected => {
    setForm({ ...form, farmer_ids: selected.map(f => f.value) });
    console.log('Selected farmers:', selected);
    console.log('Farmer IDs:', selected.map(f => f.value));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createContract(form);
      setSuccess('Contract created successfully!');
      setForm({ name: '', description: '', deadline: '', status: 'pending', farmer_ids: [] });
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create contract');
    }
  };

  return (
    <div className="create-contract-container">
      <div className="create-contract-header">
        <h2 className="create-contract-title">Create New Contract</h2>
        <p className="create-contract-subtitle">Set up a new farming contract with detailed specifications</p>
      </div>

      <form onSubmit={handleSubmit} className="create-contract-form">
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">📋</span>
            Contract Information
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                <span className="label-icon">📝</span>
                Contract Name
              </label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                className="form-input"
                placeholder="Enter a descriptive contract name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                <span className="label-icon">📄</span>
                Contract Description
              </label>
              <textarea 
                id="description" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                required 
                rows={5}
                className="form-textarea"
                placeholder="Describe the contract requirements, deliverables, and specifications in detail..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="deadline" className="form-label">
                <span className="label-icon">📅</span>
                Contract Deadline
              </label>
              <input 
                type="date" 
                id="deadline" 
                name="deadline" 
                value={form.deadline} 
                onChange={handleChange} 
                required 
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
              <small className="form-help">Select the final completion date for this contract</small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">⚙️</span>
            Contract Settings
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📊</span>
                Initial Status
              </label>
              <Select
                options={statusOptions}
                value={statusOptions.find(opt => opt.value === form.status)}
                onChange={handleStatusChange}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select contract status"
              />
              <small className="form-help">Set the initial status for this contract</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🌾</span>
                Assign Farmers
                <span className="label-optional">(Optional)</span>
              </label>
              <Select
                options={farmers}
                isMulti
                onChange={handleFarmersChange}
                value={farmers.filter(f => form.farmer_ids.includes(f.value))}
                placeholder="Search and select farmers to assign..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
              <small className="form-help">You can assign farmers now or leave it empty to assign later</small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            <span className="btn-icon">❌</span>
            Cancel
          </button>
          <button type="submit" className="create-btn">
            <span className="btn-icon">✅</span>
            Create Contract
          </button>
        </div>

        {error && <div className="admin-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>}
        {success && <div className="admin-success">
          <span className="success-icon">✅</span>
          {success}
        </div>}
      </form>
    </div>
  );
};

export default CreateContractForm;