import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { getContract, updateContract, getFarmers } from './adminAPI';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const EditContractForm = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
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
    getContract(contractId).then(res => {
      const contract = res.data.contract;
      setForm({
        name: contract.name,
        description: contract.description,
        deadline: contract.deadline?.slice(0, 10) || '',
        status: contract.status,
        farmer_ids: contract.farmers || []
      });
    });
    getFarmers().then(res => {
      setFarmers(
        (res.data.farmers || []).map(farmer => ({
          value: farmer._id || farmer.id,
          label: farmer.name + ' (' + farmer.email + ')'
        }))
      );
    });
  }, [contractId]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStatusChange = option => {
    setForm({ ...form, status: option.value });
  };

  const handleFarmersChange = selected => {
    setForm({ ...form, farmer_ids: selected.map(f => f.value) });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await updateContract(contractId, form);
      setSuccess('Contract updated successfully!');
      setTimeout(() => navigate('/admin'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update contract');
    }
  };

  return (
    <div className="edit-contract-container">
      <div className="edit-contract-header">
        <h2 className="edit-contract-title">Edit Contract</h2>
        <p className="edit-contract-subtitle">Update contract information and settings</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-contract-form">
        <div className="form-section">
          <h3 className="section-title">Contract Details</h3>
          
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
                placeholder="Enter contract name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                <span className="label-icon">📄</span>
                Description
              </label>
              <textarea 
                id="description" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                required 
                rows={4}
                className="form-textarea"
                placeholder="Describe the contract requirements and details"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="deadline" className="form-label">
                <span className="label-icon">📅</span>
                Deadline
              </label>
              <input 
                type="date" 
                id="deadline" 
                name="deadline" 
                value={form.deadline} 
                onChange={handleChange} 
                required 
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Contract Settings</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📊</span>
                Status
              </label>
              <Select
                options={statusOptions}
                value={statusOptions.find(opt => opt.value === form.status)}
                onChange={handleStatusChange}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select status"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🌾</span>
                Assigned Farmers
              </label>
              <Select
                options={farmers}
                isMulti
                onChange={handleFarmersChange}
                value={farmers.filter(f => form.farmer_ids.includes(f.value))}
                placeholder="Search and select farmers..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/admin')}>
            <span className="btn-icon">❌</span>
            Cancel
          </button>
          <button type="submit" className="update-btn">
            <span className="btn-icon">✅</span>
            Update Contract
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

export default EditContractForm;